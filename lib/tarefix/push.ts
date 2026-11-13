import webpush from 'web-push'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

/**
 * Notificações push do Tarefix (Web Push + VAPID).
 * Chaves VAPID ficam em tarefix.push_config (geradas aqui na primeira vez,
 * sem precisar configurar nada na Vercel). Só o servidor usa este módulo.
 */

export type TipoPush = 'inicio' | 'fechamento' | 'reprovada' | 'resumo' | 'extra' | 'concluida'
export const TIPOS_PUSH: { tipo: TipoPush; rotulo: string; para: 'colaborador' | 'dono' }[] = [
  { tipo: 'inicio', rotulo: 'Na hora de começar cada tarefa', para: 'colaborador' },
  { tipo: 'fechamento', rotulo: '30 min antes do fechamento, se houver pendentes', para: 'colaborador' },
  { tipo: 'reprovada', rotulo: 'Quando uma tarefa for reprovada', para: 'colaborador' },
  { tipo: 'resumo', rotulo: 'Resumo do dia no fechamento', para: 'dono' },
  { tipo: 'concluida', rotulo: 'Cada tarefa concluída pela equipe', para: 'dono' },
  { tipo: 'extra', rotulo: 'Nova tarefa extra para aprovar', para: 'dono' },
]
export const PUSH_PADRAO: Record<TipoPush, boolean> = { inicio: true, fechamento: true, reprovada: true, resumo: true, extra: true, concluida: true }

export function tiposLigados(v: unknown): Record<TipoPush, boolean> {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Record<TipoPush, unknown>>
  return Object.fromEntries(Object.entries(PUSH_PADRAO).map(([k, d]) => [k, typeof o[k as TipoPush] === 'boolean' ? o[k as TipoPush] : d])) as Record<TipoPush, boolean>
}

type Db = ReturnType<typeof createTarefixAdmin>

/** Chaves VAPID (cria e guarda na primeira vez). */
export async function chavesVapid(db: Db = createTarefixAdmin()): Promise<{ publica: string; privada: string; segredo: string }> {
  const { data } = await db.from('push_config').select('vapid_publico, vapid_privado, segredo_cron').eq('id', 1).maybeSingle()
  if (data?.vapid_publico && data?.vapid_privado) return { publica: data.vapid_publico, privada: data.vapid_privado, segredo: data.segredo_cron }
  const novas = webpush.generateVAPIDKeys()
  // só grava se ainda estiver vazio (duas chamadas ao mesmo tempo não trocam a chave)
  await db.from('push_config').update({ vapid_publico: novas.publicKey, vapid_privado: novas.privateKey }).eq('id', 1).is('vapid_publico', null)
  const { data: final } = await db.from('push_config').select('vapid_publico, vapid_privado, segredo_cron').eq('id', 1).single()
  return { publica: final!.vapid_publico, privada: final!.vapid_privado, segredo: final!.segredo_cron }
}

export type Mensagem = { titulo: string; corpo: string; url: string; tag?: string }

type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }

/** Envia para as inscrições dadas; remove as que o navegador invalidou. */
export async function enviar(inscricoes: Inscricao[], msg: Mensagem, db: Db = createTarefixAdmin()): Promise<number> {
  if (inscricoes.length === 0) return 0
  const { publica, privada } = await chavesVapid(db)
  webpush.setVapidDetails('mailto:contato@tarefix.app', publica, privada)
  const payload = JSON.stringify({ titulo: msg.titulo, corpo: msg.corpo, url: msg.url, tag: msg.tag })
  let ok = 0
  const mortas: string[] = []
  await Promise.all(
    inscricoes.map(async (i) => {
      try {
        await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, payload, { TTL: 60 * 60, urgency: 'high' })
        ok++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) mortas.push(i.id) // inscrição expirada ou removida
      }
    })
  )
  if (mortas.length) await db.from('push_inscricoes').delete().in('id', mortas)
  return ok
}

/** Marca como enviado; devolve false se a chave já existia (não enviar de novo). */
export async function marcarEnviado(chave: string, empresaId: string, db: Db = createTarefixAdmin()): Promise<boolean> {
  const { error } = await db.from('push_enviados').insert({ chave, empresa_id: empresaId })
  return !error
}

export async function inscricoesDoColaborador(colaboradorId: string, db: Db = createTarefixAdmin()) {
  const { data } = await db.from('push_inscricoes').select('id, endpoint, p256dh, auth').eq('colaborador_id', colaboradorId)
  return (data ?? []) as Inscricao[]
}

export async function inscricoesDosDonos(empresaId: string, db: Db = createTarefixAdmin()) {
  const { data } = await db.from('push_inscricoes').select('id, endpoint, p256dh, auth').eq('empresa_id', empresaId).not('dono_id', 'is', null)
  return (data ?? []) as Inscricao[]
}

/** Atalho: manda para o colaborador se o tipo estiver ligado na empresa. Nunca lança erro. */
export async function avisarColaborador(empresa: { id: string; push_tipos?: unknown }, colaboradorId: string, tipo: TipoPush, msg: Mensagem) {
  try {
    if (!tiposLigados(empresa.push_tipos)[tipo]) return
    const db = createTarefixAdmin()
    await enviar(await inscricoesDoColaborador(colaboradorId, db), msg, db)
  } catch (e) {
    console.error('[tarefix push] colaborador', e)
  }
}

/** Atalho: manda para os donos da empresa se o tipo estiver ligado. Nunca lança erro. */
export async function avisarDonos(empresa: { id: string; push_tipos?: unknown }, tipo: TipoPush, msg: Mensagem) {
  try {
    if (!tiposLigados(empresa.push_tipos)[tipo]) return
    const db = createTarefixAdmin()
    await enviar(await inscricoesDosDonos(empresa.id, db), msg, db)
  } catch (e) {
    console.error('[tarefix push] dono', e)
  }
}
