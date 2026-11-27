'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { STATUS_LEAD, valido } from '@/lib/opcoes'

export async function mudarStatusLead(id: string, status: string) {
  const { supabase } = await assertAdmin()
  if (!valido(STATUS_LEAD, status)) throw new Error('Status inválido')
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
}

export async function salvarNotasLead(id: string, notas: string) {
  const { supabase } = await assertAdmin()
  const { error } = await supabase.from('leads').update({ notas: notas.slice(0, 2000) || null }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function marcarContatado(id: string) {
  const { supabase } = await assertAdmin()
  await supabase.from('leads').update({ status: 'contatado' }).eq('id', id).eq('status', 'novo')
  revalidatePath('/admin/leads')
}
