'use server'

import { randomUUID } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { mentoradoPorToken, montarTelaMentoria as montar, type EstadoMentoria, type Mentorado } from '@/lib/tarefix/mentoria'
import { avisarDonos, chavesVapid } from '@/lib/tarefix/push'
import { apagarInscricao, gravarInscricao, type InscricaoNavegador } from '@/lib/tarefix/pushInscricao'

const BUCKET = 'tarefix-provas'
export type { EstadoMentoria }

type Resposta = { ok: true; estado: EstadoMentoria } | { ok: false; erro: string; estado?: EstadoMentoria }

async function contexto(token: string): Promise<Mentorado | { ok: false; erro: string }> {
  const m = await mentoradoPorToken(token)
  return m ?? { ok: false, erro: 'Este link não funciona mais. Peça o link novo ao seu mentor.' }
}

export async function recarregarMentoria(token: string): Promise<Resposta> {
  const m = await contexto(token)
  if ('ok' in m) return m
  return { ok: true, estado: await montar(m) }
}

export async function prepararUploadMentoria(token: string): Promise<{ ok: true; caminho: string; tokenUpload: string } | { ok: false; erro: string }> {
  const m = await contexto(token)
  if ('ok' in m) return m
  const caminho = `${m.empresa_id}/mentoria/${m.id}/${randomUUID()}.jpg`
  const { data, error } = await createTarefixAdmin().storage.from(BUCKET).createSignedUploadUrl(caminho)
  if (error || !data) return { ok: false, erro: 'Não consegui preparar o envio da foto. Tente de novo.' }
  return { ok: true, caminho: data.path, tokenUpload: data.token }
}

async function fotoValida(m: Mentorado, caminho: string) {
  const prefixo = `${m.empresa_id}/mentoria/${m.id}/`
  if (!caminho.startsWith(prefixo) || !/^[a-f0-9-]+\.jpg$/.test(caminho.slice(prefixo.length))) return false
  const nome = caminho.slice(prefixo.length)
  const { data } = await createTarefixAdmin().storage.from(BUCKET).list(prefixo.slice(0, -1), { search: nome, limit: 1 })
  return Boolean(data?.some((o) => o.name === nome))
}

/** Entregar uma missão (com a prova que ela pede). */
export async function entregarMissao(token: string, entregaId: string, d: { texto?: string; foto?: string }): Promise<Resposta> {
  const m = await contexto(token)
  if ('ok' in m) return m
  const db = createTarefixAdmin()
  const { data: e } = await db.from('entregas').select('*').eq('id', entregaId).eq('mentorado_id', m.id).maybeSingle()
  if (!e) return { ok: false, erro: 'Missão não encontrada.' }
  const { data: missao } = await db.from('missoes').select('*').eq('id', e.missao_id).maybeSingle()
  if (!missao || !missao.ativo) return { ok: false, erro: 'Esta missão foi pausada.' }
  if (e.status !== 'pendente' && e.status !== 'devolvida') return { ok: true, estado: await montar(m) }

  const texto = (d.texto ?? '').trim().slice(0, 2000)
  if (missao.prova === 'texto' && !texto) return { ok: false, erro: 'Escreva a sua resposta para entregar.' }
  if (missao.prova === 'foto' && (!d.foto || !(await fotoValida(m, d.foto)))) return { ok: false, erro: 'A foto não chegou. Tente de novo.' }

  const { error } = await db
    .from('entregas')
    .update({
      status: missao.aprovacao ? 'enviada' : 'aprovada',
      texto: texto || null,
      foto_path: missao.prova === 'foto' ? d.foto : null,
      enviada_em: new Date().toISOString(),
      decidida_em: missao.aprovacao ? null : new Date().toISOString(),
    })
    .eq('id', e.id)
    .in('status', ['pendente', 'devolvida'])
  if (error) return { ok: false, erro: 'Não consegui registrar. Tente de novo.' }

  // avisa o mentor: no sininho e, se precisar aprovar, no celular
  const { data: empresa } = await db.from('empresas').select('id, push_tipos').eq('id', m.empresa_id).maybeSingle()
  const primeiro = m.nome.split(' ')[0]
  await db.from('avisos').upsert(
    {
      empresa_id: m.empresa_id,
      tipo: 'geral',
      texto: `${primeiro} entregou: ${missao.titulo}${missao.aprovacao ? ' (para aprovar)' : ''}`,
      link: `/tarefix/painel/mentoria/${m.id}`,
      chave: `entrega:${e.id}:${Date.now()}`,
    },
    { onConflict: 'empresa_id,chave', ignoreDuplicates: true }
  )
  if (empresa && missao.aprovacao) {
    await avisarDonos(empresa, 'extra', { titulo: `${primeiro} entregou uma missão`, corpo: `${missao.titulo} · toque para aprovar`, url: `/tarefix/painel/mentoria/${m.id}`, tag: `mentoria-${m.id}` })
  }
  return { ok: true, estado: await montar(m) }
}

/* ------------------------------ notificações ------------------------------ */

export async function chavePushMentoria(token: string): Promise<{ ok: true; chave: string } | { ok: false; erro: string }> {
  const m = await contexto(token)
  if ('ok' in m) return m
  const { publica } = await chavesVapid()
  return { ok: true, chave: publica }
}

export async function ativarPushMentoria(token: string, inscricao: InscricaoNavegador, navegador: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const m = await contexto(token)
  if ('ok' in m) return m
  return gravarInscricao({ empresa_id: m.empresa_id, mentorado_id: m.id }, inscricao, navegador)
}

export async function desativarPushMentoria(token: string, endpoint: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const m = await contexto(token)
  if ('ok' in m) return m
  await apagarInscricao(endpoint, { mentorado_id: m.id })
  return { ok: true }
}

/** Marca/desmarca um item do checklist de uma missão em aberto. */
export async function marcarItemMissao(token: string, entregaId: string, indice: number, feito: boolean): Promise<Resposta> {
  const m = await contexto(token)
  if ('ok' in m) return m
  const db = createTarefixAdmin()
  const { data: e } = await db.from('entregas').select('id, status, checklist').eq('id', entregaId).eq('mentorado_id', m.id).maybeSingle()
  if (!e) return { ok: false, erro: 'Missão não encontrada.' }
  if (e.status !== 'pendente' && e.status !== 'devolvida') return { ok: true, estado: await montar(m) }
  const lista = (Array.isArray(e.checklist) ? e.checklist : []) as { t: string; f: boolean }[]
  if (!Number.isInteger(indice) || indice < 0 || indice >= lista.length) return { ok: false, erro: 'Item não encontrado.' }
  lista[indice] = { ...lista[indice], f: Boolean(feito) }
  const { error } = await db.from('entregas').update({ checklist: lista }).eq('id', e.id)
  if (error) return { ok: false, erro: 'Não consegui marcar. Tente de novo.' }
  return { ok: true, estado: await montar(m) }
}
