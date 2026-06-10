'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function autorizarDono(feedbackId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' as const }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' as const }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fb } = await (supabase as any)
    .from('feedbacks_cliente').select('barbearia_id').eq('id', feedbackId).single() as
    { data: { barbearia_id: string } | null }
  if (!fb || fb.barbearia_id !== usuario.barbearia_id) return { error: 'Sem permissão.' as const }
  return { supabase }
}

export async function marcarFeedbackLido(id: string, lido: boolean) {
  const auth = await autorizarDono(id)
  if ('error' in auth) return { error: auth.error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auth.supabase as any).from('feedbacks_cliente').update({ lido }).eq('id', id)
  revalidatePath('/dashboard/feedback-cliente/painel')
  return { ok: true as const }
}

export async function arquivarFeedback(id: string, arquivado: boolean) {
  const auth = await autorizarDono(id)
  if ('error' in auth) return { error: auth.error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auth.supabase as any).from('feedbacks_cliente').update({ arquivado }).eq('id', id)
  revalidatePath('/dashboard/feedback-cliente/painel')
  return { ok: true as const }
}

export async function alternarBrindeUsado(id: string, usado: boolean) {
  const auth = await autorizarDono(id)
  if ('error' in auth) return { error: auth.error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auth.supabase as any).from('feedbacks_cliente').update({ brinde_usado: usado }).eq('id', id)
  revalidatePath('/dashboard/feedback-cliente/painel')
  return { ok: true as const }
}
