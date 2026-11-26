import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { agoraSP, diaDaSemana, hojeSP, minutosDeHorario, somarDias } from '@/lib/tarefix/datas'

/**
 * Mentoria: o admin cria MISSÕES para mentorados (que não precisam de conta:
 * abrem /tarefix/m/[token]). Cada missão vira ENTREGAS — uma por prazo — que
 * são geradas sob demanda (sem cron), como as tarefas do dia.
 *
 *   data     → uma entrega, no dia escolhido
 *   dias     → uma entrega em cada dia da semana marcado (prazo = o próprio dia)
 *   semanal  → uma entrega por semana, com prazo no dia da semana escolhido
 *
 * Geramos de 30 dias atrás (a partir de quando a missão foi atribuída) até 7
 * dias à frente. Só o servidor usa este módulo (service role).
 */

type Db = ReturnType<typeof createTarefixAdmin>

export type TipoMissao = 'data' | 'dias' | 'semanal'
export type Prova = 'nenhuma' | 'foto' | 'texto'
export type StatusEntrega = 'pendente' | 'enviada' | 'aprovada' | 'devolvida'
export type Situacao = 'atrasada' | 'hoje' | 'proxima' | 'aguardando' | 'devolvida' | 'concluida' | 'fechada'

/** Marca, em entregas.motivo, as missões dispensadas porque a barbearia estava fechada. */
export const MOTIVO_FECHADA = 'barbearia-fechada'

export type Missao = {
  id: string
  empresa_id: string
  titulo: string
  descricao: string | null
  tipo: TipoMissao
  data: string | null
  dias_semana: number[]
  dia_prazo: number | null
  hora: string | null
  prova: Prova
  aprovacao: boolean
  ativo: boolean
  inicio?: string | null
  fim?: string | null
  checklist?: string[]
  destaque?: boolean // prioridade: topo da lista, cor diferente
  criado_em: string
}

export type Mentorado = { id: string; empresa_id: string; nome: string; whatsapp: string | null; token: string; ativo: boolean; criado_em: string }

export type EntregaTela = {
  id: string
  missao_id: string
  titulo: string
  descricao: string | null
  prova: Prova
  aprovacao: boolean
  prazo: string
  hora: string | null // 'HH:MM'
  status: StatusEntrega
  situacao: Situacao
  texto: string | null
  foto_path: string | null
  enviada_em: string | null
  motivo: string | null
  /** Recado do mentor nesta missão. */
  comentario: string | null
  comentario_em: string | null
  tipo: TipoMissao
  checklist: { t: string; f: boolean }[]
  destaque: boolean
}

export const JANELA_PASSADO = 30
export const JANELA_FUTURO = 7

/** Prazos que uma missão gera entre `de` e `ate` (inclusive). */
export function prazosDaMissao(m: Pick<Missao, 'tipo' | 'data' | 'dias_semana' | 'dia_prazo' | 'inicio' | 'fim'>, de: string, ate: string): string[] {
  if (m.tipo === 'data') return m.data ? [m.data] : []
  // período opcional (começa em / termina em)
  if (m.inicio && m.inicio > de) de = m.inicio
  if (m.fim && m.fim < ate) ate = m.fim
  const out: string[] = []
  for (let d = de; d <= ate; d = somarDias(d, 1)) {
    const dow = diaDaSemana(d)
    if (m.tipo === 'dias' ? m.dias_semana.includes(dow) : dow === m.dia_prazo) out.push(d)
  }
  return out
}

/** Situação para a tela (atrasada, hoje, aguardando aprovação…). */
export function situacaoDe(e: { status: StatusEntrega; prazo: string; hora: string | null; motivo?: string | null }, ref: Date = new Date()): Situacao {
  if (e.status === 'aprovada') return e.motivo === MOTIVO_FECHADA ? 'fechada' : 'concluida'
  if (e.status === 'enviada') return 'aguardando'
  if (e.status === 'devolvida') return 'devolvida'
  const agora = agoraSP(ref)
  if (e.prazo < agora.data) return 'atrasada'
  if (e.prazo === agora.data) return e.hora && agora.minutosDoDia > minutosDeHorario(e.hora) ? 'atrasada' : 'hoje'
  return 'proxima'
}

type LinhaEntrega = { id: string; missao_id: string; mentorado_id: string; prazo: string; status: StatusEntrega; texto: string | null; foto_path: string | null; enviada_em: string | null; motivo: string | null; checklist: unknown; comentario?: string | null; comentario_em?: string | null }

/**
 * Cria as entregas que faltam e tira as pendentes de missões pausadas,
 * desatribuídas ou de dias que saíram da missão (só daqui para a frente).
 *
 * Rápido: lê vínculos e entregas de uma vez, grava só o que falta e devolve
 * as linhas já atualizadas (quem lê não precisa buscar de novo).
 */
export async function gerarEntregas(mentoradoId: string, db: Db = createTarefixAdmin()): Promise<{ linhas: LinhaEntrega[]; missoes: Record<string, Missao> }> {
  const hoje = hojeSP()
  const ate = somarDias(hoje, JANELA_FUTURO)
  const [{ data: atrib }, { data: existentes }] = await Promise.all([
    db.from('missoes_mentorados').select('missao_id, criado_em').eq('mentorado_id', mentoradoId),
    db.from('entregas').select('*').eq('mentorado_id', mentoradoId).gte('prazo', somarDias(hoje, -60)),
  ])
  let linhas = (existentes ?? []) as LinhaEntrega[]
  // missões vinculadas + as das entregas antigas (histórico de missões desvinculadas)
  const ids = Array.from(new Set([...(atrib ?? []).map((a) => a.missao_id), ...linhas.map((l) => l.missao_id)]))
  const { data: lista } = ids.length ? await db.from('missoes').select('*').in('id', ids) : { data: [] as Missao[] }
  const missoes = Object.fromEntries(((lista ?? []) as Missao[]).map((m) => [m.id, m]))
  const vinculadas = new Set((atrib ?? []).map((a) => a.missao_id))
  const ativas = Object.values(missoes).filter((m) => m.ativo && vinculadas.has(m.id))

  const ja = new Set(linhas.map((l) => `${l.missao_id}:${l.prazo}`))
  const esperadas = new Set<string>()
  const novas: { missao_id: string; mentorado_id: string; prazo: string; checklist: { t: string; f: boolean }[] }[] = []
  for (const m of ativas) {
    const desde = agoraSP(new Date((atrib ?? []).find((a) => a.missao_id === m.id)!.criado_em)).data
    const de = desde > somarDias(hoje, -JANELA_PASSADO) ? desde : somarDias(hoje, -JANELA_PASSADO)
    for (const prazo of prazosDaMissao(m, de, ate)) {
      const chave = `${m.id}:${prazo}`
      esperadas.add(chave)
      if (!ja.has(chave)) novas.push({ missao_id: m.id, mentorado_id: mentoradoId, prazo, checklist: (m.checklist ?? []).map((t) => ({ t, f: false })) })
    }
  }
  if (novas.length) {
    const { data: criadas } = await db.from('entregas').upsert(novas, { onConflict: 'missao_id,mentorado_id,prazo', ignoreDuplicates: true }).select('*')
    linhas = linhas.concat((criadas ?? []) as LinhaEntrega[])
  }

  // checklist editado pelo mentor: alinha as abertas, mantendo o que já foi marcado
  const ajustes: Promise<unknown>[] = []
  for (const p of linhas) {
    if (p.status !== 'pendente' && p.status !== 'devolvida') continue
    const m = missoes[p.missao_id]
    if (!m || !m.ativo || !vinculadas.has(m.id)) continue
    const atual = (Array.isArray(p.checklist) ? p.checklist : []) as { t: string; f: boolean }[]
    const novo = (m.checklist ?? []).map((t) => ({ t, f: atual.some((x) => x.t === t && x.f) }))
    if (JSON.stringify(novo) !== JSON.stringify(atual)) {
      p.checklist = novo
      ajustes.push(Promise.resolve(db.from('entregas').update({ checklist: novo }).eq('id', p.id)))
    }
  }
  // pendentes que não valem mais (devolvida, que já tem entrega, não some)
  const remover = linhas
    .filter((p) => p.status === 'pendente')
    .filter((p) => !(missoes[p.missao_id]?.ativo && vinculadas.has(p.missao_id)) || (p.prazo >= hoje && !esperadas.has(`${p.missao_id}:${p.prazo}`)))
    .map((p) => p.id)
  if (remover.length) {
    ajustes.push(Promise.resolve(db.from('entregas').delete().in('id', remover)))
    const fora = new Set(remover)
    linhas = linhas.filter((l) => !fora.has(l.id))
  }
  await Promise.all(ajustes)
  return { linhas, missoes }
}

/** Lê as entregas do mentorado (gera antes), com os dados da missão e a situação. */
export async function lerEntregas(mentoradoId: string, db: Db = createTarefixAdmin(), ref: Date = new Date()): Promise<EntregaTela[]> {
  const { linhas, missoes: porId } = await gerarEntregas(mentoradoId, db)
  return linhas
    .filter((l) => porId[l.missao_id])
    .map((l) => {
      const m = porId[l.missao_id]
      const hora = m.hora ? m.hora.slice(0, 5) : null
      return {
        id: l.id,
        missao_id: m.id,
        titulo: m.titulo,
        descricao: m.descricao,
        prova: m.prova,
        aprovacao: m.aprovacao,
        prazo: l.prazo,
        hora,
        status: l.status as StatusEntrega,
        situacao: situacaoDe({ status: l.status, prazo: l.prazo, hora, motivo: l.motivo }, ref),
        texto: l.texto,
        foto_path: l.foto_path,
        enviada_em: l.enviada_em,
        motivo: l.motivo,
        comentario: l.comentario ?? null,
        comentario_em: l.comentario_em ?? null,
        checklist: Array.isArray(l.checklist) ? l.checklist : [],
        tipo: m.tipo,
        destaque: Boolean(m.destaque),
      }
    })
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.prazo.localeCompare(b.prazo) || (a.hora ?? '99').localeCompare(b.hora ?? '99') || a.titulo.localeCompare(b.titulo))
}

/** "8 de 10 no prazo": entregas que já venceram (ou foram entregues) e quantas saíram até o prazo. */
export function noPrazo(entregas: EntregaTela[], ref: Date = new Date()) {
  const hoje = agoraSP(ref).data
  // dia de barbearia fechada não conta, nem a favor nem contra
  const contam = entregas.filter((e) => e.situacao !== 'fechada' && (e.prazo < hoje || e.status === 'enviada' || e.status === 'aprovada'))
  const ok = contam.filter((e) => (e.status === 'enviada' || e.status === 'aprovada') && e.enviada_em && agoraSP(new Date(e.enviada_em)).data <= e.prazo)
  return { total: contam.length, ok: ok.length, percentual: contam.length ? Math.round((ok.length / contam.length) * 100) : null }
}

export type Reuniao = { id: string; mentorado_id: string; quando: string; link: string | null }

/** Próxima reunião (a que ainda não terminou: até 2h depois do início). */
export async function proximaReuniao(mentoradoId: string, db: Db = createTarefixAdmin()): Promise<Reuniao | null> {
  const desde = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data } = await db.from('reunioes').select('id, mentorado_id, quando, link').eq('mentorado_id', mentoradoId).gte('quando', desde).order('quando').limit(1)
  return (data?.[0] as Reuniao | undefined) ?? null
}

export async function mentoradoPorToken(token: string, db: Db = createTarefixAdmin()): Promise<Mentorado | null> {
  if (!/^[a-f0-9]{32,128}$/i.test(token)) return null
  const { data: m } = await db.from('mentorados').select('*').eq('token', token).maybeSingle()
  if (!m || !m.ativo) return null
  const { data: emp } = await db.from('empresas').select('ativo').eq('id', m.empresa_id).maybeSingle()
  if (!emp || emp.ativo === false) return null
  return m as Mentorado
}

export { textoPrazo } from '@/lib/tarefix/mentoriaTexto'

export type EstadoMentoria = {
  entregas: (EntregaTela & { foto_url: string | null })[]
  reuniao: Reuniao | null
  mentor: string
}

/** Tela do link do mentorado (recebe o mentorado JÁ validado pelo token). */
export async function montarTelaMentoria(m: Mentorado, db: Db = createTarefixAdmin()): Promise<EstadoMentoria> {
  const [entregas, reuniao, { data: dono }] = await Promise.all([
    lerEntregas(m.id, db),
    proximaReuniao(m.id, db),
    db.from('donos').select('nome').eq('empresa_id', m.empresa_id).limit(1).maybeSingle(),
  ])
  const caminhos = entregas.map((e) => e.foto_path).filter((p): p is string => Boolean(p))
  const urls: Record<string, string> = {}
  if (caminhos.length) {
    const { data: assinadas } = await db.storage.from('tarefix-provas').createSignedUrls(caminhos, 60 * 60)
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
  }
  return {
    entregas: entregas.map((e) => ({ ...e, foto_url: e.foto_path ? urls[e.foto_path] ?? null : null })),
    reuniao,
    mentor: dono?.nome?.split(' ')[0] ?? 'seu mentor',
  }
}

/* ---------------------------------------------------------------------- */
/* Engajamento: se abre o link, se instalou, se ativou as notificações     */
/* ---------------------------------------------------------------------- */

export type Engajamento = {
  primeiro: string | null // primeiro acesso (ISO)
  ultimo: string | null // último acesso (ISO)
  instalado: boolean // já abriu pelo ícone da tela de início
  notificacoes: boolean // tem aparelho com notificações ativas
  hoje: number // aberturas hoje
  dias: { data: string; n: number }[] // últimos 7 dias (do mais antigo para hoje)
  diasAtivos: number // dias com acesso nos últimos 7
}

export async function engajamentoDos(ids: string[], db: Db = createTarefixAdmin()): Promise<Record<string, Engajamento>> {
  const out: Record<string, Engajamento> = {}
  if (ids.length === 0) return out
  const hoje = hojeSP()
  const datas = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6))
  const desde = `${datas[0]}T03:00:00Z` // 00:00 em Brasília
  const [{ data: recentes }, { data: primeiros }, { data: inst }, { data: subs }] = await Promise.all([
    db.from('mentoria_acessos').select('mentorado_id, em, instalado').in('mentorado_id', ids).gte('em', desde).order('em', { ascending: false }),
    db.from('mentoria_acessos').select('mentorado_id, em').in('mentorado_id', ids).order('em', { ascending: true }).limit(5000),
    db.from('mentoria_acessos').select('mentorado_id').in('mentorado_id', ids).eq('instalado', true).limit(5000),
    db.from('push_inscricoes').select('mentorado_id').in('mentorado_id', ids),
  ])
  for (const id of ids) {
    const meus = (recentes ?? []).filter((a) => a.mentorado_id === id)
    const todos = (primeiros ?? []).filter((a) => a.mentorado_id === id)
    const porDia = datas.map((d) => ({ data: d, n: meus.filter((a) => agoraSP(new Date(a.em)).data === d).length }))
    out[id] = {
      primeiro: todos[0]?.em ?? null,
      ultimo: meus[0]?.em ?? (todos.length ? todos[todos.length - 1].em : null),
      instalado: (inst ?? []).some((a) => a.mentorado_id === id),
      notificacoes: (subs ?? []).some((s) => s.mentorado_id === id),
      hoje: porDia[6].n,
      dias: porDia,
      diasAtivos: porDia.filter((d) => d.n > 0).length,
    }
  }
  return out
}
