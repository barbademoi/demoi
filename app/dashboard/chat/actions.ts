'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ehAssinanteAtivo } from '@/lib/chat/acesso'

export type ResultadoEnvio = { ok?: true; error?: string }

const LIMITE = 4000

/**
 * Assinante manda mensagem no SUPORTE (conversa 1-a-1 com o admin).
 *
 * Escreve com o client do próprio usuário, não com o service_role: assim a
 * policy de insert é quem decide, e ela já prende `usuario_id = auth.uid()` e
 * `autor = 'cliente'`. Usar o admin client aqui trocaria uma trava do banco
 * por uma verificação em código — mais fácil de furar num refactor.
 */
export async function enviarMensagemSuporte(corpo: string): Promise<ResultadoEnvio> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.' }

  const texto = String(corpo ?? '').trim().slice(0, LIMITE)
  if (texto.length < 1) return { error: 'Escreva a mensagem antes de enviar.' }

  if (!(await ehAssinanteAtivo(supabase))) {
    return { error: 'O chat é exclusivo para assinantes com assinatura ativa.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('chat_suporte')
    .insert({ usuario_id: user.id, autor: 'cliente', corpo: texto })

  if (error) {
    console.error('[chat] erro ao enviar mensagem:', error)
    return { error: 'Não foi possível enviar. Tente novamente.' }
  }

  revalidatePath('/dashboard/chat')
  return { ok: true }
}

/** Marca como lidas as respostas do admin. Passa pela função do banco. */
export async function marcarSuporteLido(): Promise<ResultadoEnvio> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('chat_marcar_lido')
  if (error) {
    console.error('[chat] erro ao marcar lido:', error)
    return { error: 'Não foi possível marcar como lido.' }
  }
  revalidatePath('/dashboard/chat')
  return { ok: true }
}

/** Marca comunicados como lidos (o que zera o contador do menu). */
export async function marcarComunicadosLidos(ids: string[]): Promise<ResultadoEnvio> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const validos = (ids ?? [])
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, 200)
  if (validos.length === 0) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('chat_comunicado_leituras')
    .upsert(
      validos.map((comunicado_id) => ({ comunicado_id, usuario_id: user.id })),
      { onConflict: 'comunicado_id,usuario_id', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[chat] erro ao marcar comunicados:', error)
    return { error: 'Não foi possível marcar como lido.' }
  }
  revalidatePath('/dashboard/chat')
  return { ok: true }
}
