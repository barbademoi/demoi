'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { validarComunicado, renderizarComunicado, type ContextoChat } from '@/lib/chat/marcadores'

export type Resultado = { ok?: true; error?: string }

export type LinhaConversa = {
  usuarioId: string
  email: string
  barbearia: string
  assinaturaOk: boolean
  status: string | null
  validoAte: string | null
  ultimaMensagem: string
  ultimaEm: string
  naoLidas: number
  total: number
}

export type MensagemAdmin = {
  id: string
  autor: 'cliente' | 'admin'
  corpo: string
  criadoEm: string
}

const LIMITE = 4000

/**
 * Revalidado em TODA action, não só na página. O painel esconde o botão, mas
 * quem impede a ação é esta checagem — é o mesmo desenho de /admin/assinaturas.
 */
async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return null
  return user
}

/** Publica UMA mensagem que todos os assinantes ativos passam a ver. */
export async function publicarComunicado(corpo: string): Promise<Resultado> {
  const admin = await assertAdmin()
  if (!admin) return { error: 'Sem permissão.' }

  const texto = String(corpo ?? '').trim().slice(0, LIMITE)
  if (texto.length < 1) return { error: 'Escreva a mensagem antes de publicar.' }

  // Marcador inexistente sai da frase na hora de exibir. Melhor barrar aqui,
  // enquanto dá pra corrigir, do que publicar uma frase com um buraco.
  const { desconhecidos } = validarComunicado(texto)
  if (desconhecidos.length > 0) {
    return { error: `Marcador que não existe: ${desconhecidos.map(d => `{${d}}`).join(', ')}. Corrija ou remova antes de publicar.` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createAdminClient() as any)
    .from('chat_comunicados')
    .insert({ corpo: texto, publicado_por: admin.id })

  if (error) {
    console.error('[admin/chat] erro ao publicar:', error)
    return { error: 'Não foi possível publicar.' }
  }
  console.log('[admin/chat] comunicado publicado por', admin.email)
  revalidatePath('/admin/chat')
  revalidatePath('/dashboard/chat')
  return { ok: true }
}

/** Tira um comunicado do ar sem apagar o histórico. */
export async function despublicarComunicado(id: string): Promise<Resultado> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Comunicado inválido.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createAdminClient() as any)
    .from('chat_comunicados').update({ ativo: false }).eq('id', id)

  if (error) {
    console.error('[admin/chat] erro ao despublicar:', error)
    return { error: 'Não foi possível tirar do ar.' }
  }
  revalidatePath('/admin/chat')
  revalidatePath('/dashboard/chat')
  return { ok: true }
}

/** Prévia com os dados REAIS de uma barbearia, pra conferir antes de publicar. */
export async function preverComunicado(
  corpo: string,
  barbeariaId: string | null,
): Promise<{ texto?: string; semDado?: string[]; error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createAdminClient()
  let contexto: Partial<ContextoChat> = {}

  if (barbeariaId && /^[0-9a-f-]{36}$/i.test(barbeariaId)) {
    const { data } = await db.rpc('chat_contexto_barbearia', { p_barbearia_id: barbeariaId })
    contexto = (data ?? {}) as Partial<ContextoChat>
  }

  const r = renderizarComunicado(String(corpo ?? ''), contexto)
  return { texto: r.texto, semDado: r.semDado }
}

/** Responde um assinante. Grava com usuario_id DELE e autor='admin'. */
export async function responderSuporte(usuarioId: string, corpo: string): Promise<Resultado> {
  const admin = await assertAdmin()
  if (!admin) return { error: 'Sem permissão.' }
  if (!/^[0-9a-f-]{36}$/i.test(usuarioId)) return { error: 'Conversa inválida.' }

  const texto = String(corpo ?? '').trim().slice(0, LIMITE)
  if (texto.length < 1) return { error: 'Escreva a resposta antes de enviar.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createAdminClient()
  const { error } = await db.from('chat_suporte')
    .insert({ usuario_id: usuarioId, autor: 'admin', corpo: texto })

  if (error) {
    console.error('[admin/chat] erro ao responder:', error)
    return { error: 'Não foi possível enviar a resposta.' }
  }

  // Ao responder, as mensagens DELE viram lidas do meu lado.
  await db.from('chat_suporte')
    .update({ lido_em: new Date().toISOString() })
    .eq('usuario_id', usuarioId).eq('autor', 'cliente').is('lido_em', null)

  revalidatePath('/admin/chat')
  revalidatePath('/dashboard/chat')
  return { ok: true }
}

/** Marca como lidas as mensagens que o cliente me mandou. */
export async function marcarConversaLida(usuarioId: string): Promise<Resultado> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }
  if (!/^[0-9a-f-]{36}$/i.test(usuarioId)) return { error: 'Conversa inválida.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createAdminClient() as any)
    .from('chat_suporte')
    .update({ lido_em: new Date().toISOString() })
    .eq('usuario_id', usuarioId).eq('autor', 'cliente').is('lido_em', null)

  if (error) return { error: 'Não foi possível marcar como lida.' }
  revalidatePath('/admin/chat')
  return { ok: true }
}

/** Carrega a conversa inteira de um assinante. */
export async function carregarConversa(usuarioId: string): Promise<{ mensagens?: MensagemAdmin[]; error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }
  if (!/^[0-9a-f-]{36}$/i.test(usuarioId)) return { error: 'Conversa inválida.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .from('chat_suporte')
    .select('id, autor, corpo, criado_em')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: true })
    .limit(500)

  if (error) return { error: 'Não foi possível carregar a conversa.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { mensagens: ((data ?? []) as any[]).map((m) => ({
    id: m.id, autor: m.autor, corpo: m.corpo, criadoEm: m.criado_em,
  })) }
}

/** Aviso de tempo de resposta mostrado ao assinante. */
export async function salvarAvisoResposta(texto: string): Promise<Resultado> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }
  const aviso = String(texto ?? '').trim().slice(0, 240)
  if (aviso.length < 3) return { error: 'Escreva o aviso.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createAdminClient() as any)
    .from('chat_config')
    .update({ aviso_resposta: aviso, atualizado_em: new Date().toISOString() })
    .eq('id', true)

  if (error) return { error: 'Não foi possível salvar o aviso.' }
  revalidatePath('/admin/chat')
  revalidatePath('/dashboard/chat')
  return { ok: true }
}
