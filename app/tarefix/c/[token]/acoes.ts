'use server'

import { randomUUID } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { carregarAcesso, gravarSessao } from '@/lib/tarefix/sessaoColaborador'
import { conferirPin, pinValido } from '@/lib/tarefix/pin'
import { agoraSP, dataCurta, hojeSP, minutosDeHorario, minutosParaFechamento, somarDias } from '@/lib/tarefix/datas'
import { liberacaoContinuas } from '@/lib/tarefix/continuas'
import { avisarDonos, chavesVapid } from '@/lib/tarefix/push'
import { apagarInscricao, gravarInscricao, type InscricaoNavegador } from '@/lib/tarefix/pushInscricao'
import { montarDiaPassado, montarEstado, type Ctx, type DiaPassado, type EstadoHoje } from '@/lib/tarefix/estadoHoje'

const BUCKET = 'tarefix-provas'
const MAX_TENTATIVAS = 5
const BLOQUEIO_MS = 5 * 60 * 1000

type Resposta = { ok: true; estado: EstadoHoje } | { ok: false; erro: string; estado?: EstadoHoje }

async function contexto(token: string): Promise<Ctx | { ok: false; erro: string }> {
  const a = await carregarAcesso(token)
  if (a.estado === 'invalido') return { ok: false, erro: 'Este link não é mais válido. Peça um link novo.' }
  if (a.estado === 'pin') return { ok: false, erro: 'Sua sessão expirou. Recarregue a página e digite o PIN.' }
  return { colaborador: a.colaborador, empresa: a.empresa }
}

/** Caminho de upload válido para ESTE colaborador HOJE (impede apontar para foto de outro). */
function caminhoValido(ctx: Ctx, caminho: string) {
  const prefixo = `${ctx.empresa.id}/${ctx.colaborador.id}/${hojeSP()}/`
  return caminho.startsWith(prefixo) && /^[a-f0-9-]+\.jpg$/.test(caminho.slice(prefixo.length))
}

async function arquivoExiste(caminho: string) {
  const db = createTarefixAdmin()
  const pasta = caminho.slice(0, caminho.lastIndexOf('/'))
  const nome = caminho.slice(caminho.lastIndexOf('/') + 1)
  const { data } = await db.storage.from(BUCKET).list(pasta, { search: nome, limit: 1 })
  return Boolean(data?.some((o) => o.name === nome))
}

/* ====================================================================== */
/* PIN                                                                     */
/* ====================================================================== */

export async function entrarComPin(token: string, pin: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const a = await carregarAcesso(token)
  if (a.estado === 'invalido') return { ok: false, erro: 'Este link não é mais válido.' }
  if (a.estado === 'ok') return { ok: true }
  const c = a.colaborador
  const db = createTarefixAdmin()

  if (c.pin_bloqueado_ate && new Date(c.pin_bloqueado_ate).getTime() > Date.now()) {
    const min = Math.ceil((new Date(c.pin_bloqueado_ate).getTime() - Date.now()) / 60000)
    return { ok: false, erro: `Muitas tentativas. Tente de novo em ${min} min.` }
  }
  if (!pinValido(pin) || !conferirPin(pin, c.pin_hash)) {
    const tentativas = (c.pin_tentativas ?? 0) + 1
    if (tentativas >= MAX_TENTATIVAS) {
      await db
        .from('colaboradores')
        .update({ pin_tentativas: 0, pin_bloqueado_ate: new Date(Date.now() + BLOQUEIO_MS).toISOString() })
        .eq('id', c.id)
      return { ok: false, erro: 'PIN errado 5 vezes. Bloqueado por 5 minutos.' }
    }
    await db.from('colaboradores').update({ pin_tentativas: tentativas }).eq('id', c.id)
    const restam = MAX_TENTATIVAS - tentativas
    return { ok: false, erro: `PIN incorreto. ${restam === 1 ? 'Resta 1 tentativa' : `Restam ${restam} tentativas`}.` }
  }

  await db.from('colaboradores').update({ pin_tentativas: 0, pin_bloqueado_ate: null }).eq('id', c.id)
  gravarSessao(c)
  return { ok: true }
}

/* ====================================================================== */
/* Fotos: o navegador envia direto ao Storage com uma URL assinada         */
/* ====================================================================== */

export async function prepararUpload(token: string): Promise<{ ok: true; caminho: string; tokenUpload: string } | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const caminho = `${ctx.empresa.id}/${ctx.colaborador.id}/${hojeSP()}/${randomUUID()}.jpg`
  const { data, error } = await createTarefixAdmin().storage.from(BUCKET).createSignedUploadUrl(caminho)
  if (error || !data) return { ok: false, erro: 'Não consegui preparar o envio da foto. Tente de novo.' }
  return { ok: true, caminho: data.path, tokenUpload: data.token }
}

/* ====================================================================== */
/* Marcar / desmarcar                                                      */
/* ====================================================================== */

export async function marcarTarefa(token: string, tarefaId: string, fotoCaminho?: string, autoavaliacao?: number): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const { colaborador, empresa } = ctx
  const db = createTarefixAdmin()
  const hoje = hojeSP()

  const { data: t } = await db.from('tarefas_dia').select('*').eq('id', tarefaId).eq('colaborador_id', colaborador.id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hoje) return { ok: false, erro: 'Só dá para marcar as tarefas de hoje.' }
  // Depois do horário de fechamento ainda dá para marcar HOJE (até a meia-noite):
  // conta no percentual, mas aparece como "fora do horário" para o dono.
  if (t.status === 'feita') return { ok: true, estado: await montarEstado(ctx, false) }

  // Tarefa do dia todo: só confirma perto do fechamento, dizendo como foi.
  let nota: number | null = null
  if (t.continua) {
    const lib = liberacaoContinuas(empresa.horario_fechamento, empresa.liberar_continuas_min ?? 60)
    if (minutosParaFechamento(empresa.horario_fechamento) > (empresa.liberar_continuas_min ?? 60)) {
      return { ok: false, erro: `Esta vale o dia todo: a confirmação libera às ${lib}.` }
    }
    nota = Math.round(Number(autoavaliacao))
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) return { ok: false, erro: 'Diga como foi o dia nesta tarefa (arraste a setinha).' }
  }

  if (t.exige_foto) {
    if (!fotoCaminho) return { ok: false, erro: 'Esta tarefa precisa de foto.' }
    if (!caminhoValido(ctx, fotoCaminho) || !(await arquivoExiste(fotoCaminho))) return { ok: false, erro: 'A foto não chegou. Tente de novo.' }
  }

  const { data: atualizada, error } = await db
    .from('tarefas_dia')
    .update({
      status: 'feita',
      feita_em: new Date().toISOString(), // horário do SERVIDOR
      foto_path: t.exige_foto ? fotoCaminho : null,
      motivo_reprovacao: null, // refeita depois de reprovada
      autoavaliacao: nota,
    })
    .eq('id', t.id)
    .in('status', ['pendente', 'reprovada'])
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, erro: error.message }

  // push para o dono a cada tarefa concluída (o aviso de cada colaborador substitui o anterior na tela)
  // — menos no Meu dia: o dono não precisa ser avisado do que ele mesmo fez
  if (atualizada && !colaborador.eh_dono) {
    const fora = minutosParaFechamento(empresa.horario_fechamento) <= 0
    const extras = [t.exige_foto && 'com foto', nota && `se avaliou: ${['', 'Difícil', 'Fraco', 'Ok', 'Bom', 'Excelente'][nota]}`, fora && 'fora do horário'].filter(Boolean)
    await avisarDonos(empresa, 'concluida', {
      titulo: `${colaborador.nome.split(' ')[0]} concluiu uma tarefa`,
      corpo: `${t.titulo}${extras.length ? ` · ${extras.join(' · ')}` : ''}`,
      url: `/tarefix/painel?c=${colaborador.id}`,
      tag: `concluida-${colaborador.id}`,
    })
  }

  if (atualizada && t.exige_foto && !colaborador.eh_dono) {
    await db.from('avisos').upsert(
      {
        empresa_id: empresa.id,
        tipo: 'foto_enviada',
        texto: `${colaborador.nome.split(' ')[0]} enviou foto: ${t.titulo}`,
        link: `/tarefix/painel?c=${colaborador.id}`,
        chave: `foto:${t.id}`,
      },
      { onConflict: 'empresa_id,chave', ignoreDuplicates: true }
    )
  }
  return { ok: true, estado: await montarEstado(ctx, false) }
}

export async function desmarcarTarefa(token: string, tarefaId: string): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const db = createTarefixAdmin()
  const hoje = hojeSP()

  const { data: t } = await db.from('tarefas_dia').select('*').eq('id', tarefaId).eq('colaborador_id', ctx.colaborador.id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hoje) return { ok: false, erro: 'Só dá para mexer nas tarefas de hoje.', estado: await montarEstado(ctx, false) }
  if (t.status !== 'feita') return { ok: true, estado: await montarEstado(ctx, false) }

  const { error } = await db
    .from('tarefas_dia')
    .update({ status: 'pendente', feita_em: null, foto_path: null, autoavaliacao: null })
    .eq('id', t.id)
    .eq('status', 'feita')
  if (error) return { ok: false, erro: error.message }
  if (t.foto_path) await db.storage.from(BUCKET).remove([t.foto_path])
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/* ====================================================================== */
/* Extras                                                                  */
/* ====================================================================== */

export async function registrarExtra(token: string, descricao: string, fotoCaminho?: string): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const texto = descricao.trim().slice(0, 500)
  if (!texto) return { ok: false, erro: 'Conte o que você fez.' }
  if (fotoCaminho && (!caminhoValido(ctx, fotoCaminho) || !(await arquivoExiste(fotoCaminho)))) {
    return { ok: false, erro: 'A foto não chegou. Tente de novo.' }
  }
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const { data: extra, error } = await db
    .from('extras')
    .insert({ empresa_id: ctx.empresa.id, colaborador_id: ctx.colaborador.id, data: hoje, descricao: texto, foto_path: fotoCaminho ?? null })
    .select('id')
    .single()
  if (error || !extra) return { ok: false, erro: error?.message ?? 'Não consegui registrar.' }
  await avisarDonos(ctx.empresa, 'extra', {
    titulo: 'Nova tarefa extra para aprovar',
    corpo: `${ctx.colaborador.nome.split(' ')[0]}: ${texto.slice(0, 120)}`,
    url: '/tarefix/painel',
    tag: 'extra',
  })
  await db.from('avisos').insert({
    empresa_id: ctx.empresa.id,
    tipo: 'extra_nova',
    texto: `${ctx.colaborador.nome.split(' ')[0]} registrou uma extra (${dataCurta(hoje)}): ${texto.slice(0, 80)}`,
    link: '/tarefix/painel',
    chave: `extra:${extra.id}`,
  })
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/* ====================================================================== */
/* Observação do colaborador na tarefa                                     */
/* ====================================================================== */

const MAX_OBSERVACAO = 200

/** Grava (ou apaga, se vazio) a observação de uma tarefa de hoje, até o dia fechar. Avisa o dono. */
export async function salvarObservacao(token: string, tarefaId: string, texto: string): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const { data: t } = await db.from('tarefas_dia').select('id, data, titulo, observacao').eq('id', tarefaId).eq('colaborador_id', ctx.colaborador.id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hoje) return { ok: false, erro: 'Só dá para mudar a observação das tarefas de hoje.', estado: await montarEstado(ctx, false) }
  const limpo = String(texto ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_OBSERVACAO)
  const novo = limpo || null
  if (novo === (t.observacao ?? null)) return { ok: true, estado: await montarEstado(ctx, false) }

  const { error } = await db
    .from('tarefas_dia')
    .update({ observacao: novo, observacao_em: novo ? new Date().toISOString() : null })
    .eq('id', t.id)
  if (error) return { ok: false, erro: error.message }

  const chave = `obs:${t.id}`
  if (novo) {
    // um aviso por tarefa: editar a observação atualiza o texto e volta a ficar "não lido"
    await db.from('avisos').upsert(
      {
        empresa_id: ctx.empresa.id,
        tipo: 'observacao',
        texto: `${ctx.colaborador.nome.split(' ')[0]} comentou em ${t.titulo}: ${novo}`,
        link: `/tarefix/painel?c=${ctx.colaborador.id}`,
        chave,
        lido: false,
        criado_em: new Date().toISOString(),
      },
      { onConflict: 'empresa_id,chave' }
    )
  } else {
    await db.from('avisos').delete().eq('empresa_id', ctx.empresa.id).eq('chave', chave)
  }
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/* ====================================================================== */
/* Notificações push (este aparelho)                                       */
/* ====================================================================== */

export async function chavePush(token: string): Promise<{ ok: true; chave: string } | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const { publica } = await chavesVapid()
  return { ok: true, chave: publica }
}

export async function ativarPush(token: string, inscricao: InscricaoNavegador, navegador: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  return gravarInscricao({ empresa_id: ctx.empresa.id, colaborador_id: ctx.colaborador.id }, inscricao, navegador)
}

export async function desativarPush(token: string, endpoint: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  await apagarInscricao(endpoint, { colaborador_id: ctx.colaborador.id })
  return { ok: true }
}

/* ====================================================================== */
/* Ver um dia anterior (só leitura)                                        */
/* ====================================================================== */

export async function verDia(token: string, data: string): Promise<{ ok: true; dia: DiaPassado } | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const dia = await montarDiaPassado(ctx, data)
  if (!dia) return { ok: false, erro: 'Esse dia não está disponível.' }
  return { ok: true, dia }
}

/** Recarrega a tela Hoje (botão "atualizar" e quando o app volta para a frente). */
export async function recarregar(token: string): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/* ====================================================================== */
/* Checklist (qualquer colaborador) e Meu dia (só o do próprio dono)       */
/* ====================================================================== */

/** Marca/desmarca um subitem do checklist de uma tarefa de hoje. */
export async function marcarItem(token: string, tarefaId: string, indice: number, feito: boolean): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const db = createTarefixAdmin()
  const { data: t } = await db.from('tarefas_dia').select('id, data, checklist').eq('id', tarefaId).eq('colaborador_id', ctx.colaborador.id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hojeSP()) return { ok: false, erro: 'Só dá para mexer nas tarefas de hoje.', estado: await montarEstado(ctx, false) }
  const lista = (Array.isArray(t.checklist) ? t.checklist : []) as { t: string; f: boolean }[]
  if (!Number.isInteger(indice) || indice < 0 || indice >= lista.length) return { ok: false, erro: 'Item não encontrado.' }
  lista[indice] = { ...lista[indice], f: Boolean(feito) }
  const { error } = await db.from('tarefas_dia').update({ checklist: lista }).eq('id', t.id)
  if (error) return { ok: false, erro: error.message }
  return { ok: true, estado: await montarEstado(ctx, false) }
}

async function contextoPessoal(token: string): Promise<Ctx | { ok: false; erro: string }> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  if (!ctx.colaborador.eh_dono) return { ok: false, erro: 'Isso só existe no Meu dia.' }
  return ctx
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Adicionar rápido: hoje, amanhã ou "Algum dia" (sem data). */
export async function adicionarRapida(
  token: string,
  d: { titulo: string; quando: 'hoje' | 'amanha' | 'algum' | 'data'; data?: string; horario?: string; categoria_id?: string | null }
): Promise<Resposta> {
  const ctx = await contextoPessoal(token)
  if ('ok' in ctx) return ctx
  const titulo = d.titulo.trim().slice(0, 120)
  if (!titulo) return { ok: false, erro: 'Escreva o que precisa fazer.' }
  const horario = d.quando !== 'algum' && d.horario && /^\d\d:\d\d$/.test(d.horario) ? d.horario : null
  const db = createTarefixAdmin()
  let categoria_id: string | null = null
  if (d.categoria_id) {
    const { data: cat } = await db.from('categorias').select('id').eq('id', d.categoria_id).eq('empresa_id', ctx.empresa.id).maybeSingle()
    categoria_id = cat?.id ?? null
  }
  const hoje = hojeSP()
  if (d.quando === 'data' && !(d.data && /^\d{4}-\d{2}-\d{2}$/.test(d.data) && d.data >= hoje)) return { ok: false, erro: 'Escolha uma data de hoje em diante.' }
  const { error } = await db.from('tarefas_avulsas').insert({
    empresa_id: ctx.empresa.id,
    colaborador_id: ctx.colaborador.id,
    titulo,
    data: d.quando === 'algum' ? null : d.quando === 'amanha' ? somarDias(hoje, 1) : d.quando === 'data' ? d.data : hoje,
    horario_inicio: horario,
    categoria_id,
    exige_foto: false,
    continua: false,
    peso: 1,
  })
  if (error) return { ok: false, erro: error.message }
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/**
 * Adiar uma tarefa pendente de hoje.
 * - '1h' / 'noite': muda o horário só hoje (avulsa: muda a própria avulsa).
 * - 'amanha': avulsa vai para amanhã; recorrente vira "adiada" hoje e ganha uma cópia avulsa amanhã.
 */
export async function adiarTarefa(token: string, tarefaId: string, opcao: '1h' | 'noite' | 'amanha'): Promise<Resposta> {
  const ctx = await contextoPessoal(token)
  if ('ok' in ctx) return ctx
  const db = createTarefixAdmin()
  const hoje = hojeSP()
  const { data: t } = await db.from('tarefas_dia').select('*').eq('id', tarefaId).eq('colaborador_id', ctx.colaborador.id).maybeSingle()
  if (!t || t.data !== hoje) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.status !== 'pendente') return { ok: true, estado: await montarEstado(ctx, false) }

  if (opcao === 'amanha') {
    const amanha = somarDias(hoje, 1)
    if (t.origem === 'avulsa') {
      await db.from('tarefas_avulsas').update({ data: amanha }).eq('id', t.origem_id).eq('colaborador_id', ctx.colaborador.id)
      await db.from('tarefas_dia').delete().eq('id', t.id)
    } else {
      await db.from('tarefas_avulsas').insert({
        empresa_id: ctx.empresa.id, colaborador_id: ctx.colaborador.id, titulo: t.titulo, descricao: t.descricao, data: amanha,
        exige_foto: t.exige_foto, horario_inicio: t.horario_inicio, horario_limite: t.horario_limite, tempo_estimado_min: t.tempo_estimado_min,
        continua: t.continua, peso: t.peso, categoria_id: t.categoria_id,
        checklist: ((Array.isArray(t.checklist) ? t.checklist : []) as { t: string }[]).map((i) => i.t),
      })
      await db.from('tarefas_dia').update({ status: 'adiada' }).eq('id', t.id).eq('status', 'pendente')
    }
    return { ok: true, estado: await montarEstado(ctx, false) }
  }

  const agora = agoraSP().minutosDoDia
  const base = t.horario_inicio ? Math.max(minutosDeHorario(t.horario_inicio), agora) : agora
  let novo = opcao === '1h' ? base + 60 : Math.max(19 * 60, agora + 30)
  novo = Math.min(Math.ceil(novo / 5) * 5, 23 * 60 + 30)
  const delta = t.horario_inicio ? novo - minutosDeHorario(t.horario_inicio) : 0
  const limite = t.horario_limite ? hhmm(Math.min(minutosDeHorario(t.horario_limite) + Math.max(delta, 0), 23 * 60 + 55)) : null
  if (t.origem === 'avulsa') {
    await db.from('tarefas_avulsas').update({ horario_inicio: hhmm(novo), horario_limite: limite }).eq('id', t.origem_id).eq('colaborador_id', ctx.colaborador.id)
  }
  await db.from('tarefas_dia').update({ horario_inicio: hhmm(novo), horario_limite: limite, ajustada: true }).eq('id', t.id)
  // os lembretes da tarefa voltam a valer para o novo horário
  await db.from('push_enviados').delete().like('chave', `%:${t.id}%`)
  return { ok: true, estado: await montarEstado(ctx, false) }
}

/** "Algum dia" → hoje/amanhã, ou apagar a ideia. */
export async function moverIdeia(token: string, avulsaId: string, para: 'hoje' | 'amanha' | 'apagar' | 'data', data?: string): Promise<Resposta> {
  const ctx = await contextoPessoal(token)
  if ('ok' in ctx) return ctx
  const db = createTarefixAdmin()
  if (para === 'data' && !(data && /^\d{4}-\d{2}-\d{2}$/.test(data) && data >= hojeSP())) return { ok: false, erro: 'Escolha uma data de hoje em diante.' }
  const q = db.from('tarefas_avulsas')
  const { error } =
    para === 'apagar'
      ? await q.delete().eq('id', avulsaId).eq('colaborador_id', ctx.colaborador.id).is('data', null)
      : await q.update({ data: para === 'hoje' ? hojeSP() : para === 'data' ? data : somarDias(hojeSP(), 1) }).eq('id', avulsaId).eq('colaborador_id', ctx.colaborador.id).is('data', null)
  if (error) return { ok: false, erro: error.message }
  return { ok: true, estado: await montarEstado(ctx, false) }
}
