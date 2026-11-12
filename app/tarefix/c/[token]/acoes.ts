'use server'

import { randomUUID } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { carregarAcesso, gravarSessao } from '@/lib/tarefix/sessaoColaborador'
import { conferirPin, pinValido } from '@/lib/tarefix/pin'
import { dataCurta, diaFechado, hojeSP } from '@/lib/tarefix/datas'
import { montarEstado, type Ctx, type EstadoHoje } from '@/lib/tarefix/estadoHoje'

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

export async function marcarTarefa(token: string, tarefaId: string, fotoCaminho?: string): Promise<Resposta> {
  const ctx = await contexto(token)
  if ('ok' in ctx) return ctx
  const { colaborador, empresa } = ctx
  const db = createTarefixAdmin()
  const hoje = hojeSP()

  const { data: t } = await db.from('tarefas_dia').select('*').eq('id', tarefaId).eq('colaborador_id', colaborador.id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hoje) return { ok: false, erro: 'Só dá para marcar as tarefas de hoje.' }
  if (diaFechado(hoje, empresa.horario_fechamento)) return { ok: false, erro: 'O dia já fechou.', estado: await montarEstado(ctx, false) }
  if (t.status === 'feita') return { ok: true, estado: await montarEstado(ctx, false) }

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
    })
    .eq('id', t.id)
    .in('status', ['pendente', 'reprovada'])
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, erro: error.message }

  if (atualizada && t.exige_foto) {
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
  if (t.data !== hoje || diaFechado(hoje, ctx.empresa.horario_fechamento)) {
    return { ok: false, erro: 'O dia já fechou.', estado: await montarEstado(ctx, false) }
  }
  if (t.status !== 'feita') return { ok: true, estado: await montarEstado(ctx, false) }

  const { error } = await db
    .from('tarefas_dia')
    .update({ status: 'pendente', feita_em: null, foto_path: null })
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
  await db.from('avisos').insert({
    empresa_id: ctx.empresa.id,
    tipo: 'extra_nova',
    texto: `${ctx.colaborador.nome.split(' ')[0]} registrou uma extra (${dataCurta(hoje)}): ${texto.slice(0, 80)}`,
    link: '/tarefix/painel',
    chave: `extra:${extra.id}`,
  })
  return { ok: true, estado: await montarEstado(ctx, false) }
}
