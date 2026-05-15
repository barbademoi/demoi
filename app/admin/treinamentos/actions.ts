'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'admin'
}

export async function salvarTreinamento(
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }

  const id         = (formData.get('id')         as string | null) || null
  const ordem      = Number(formData.get('ordem'))
  const titulo     = (formData.get('titulo')     as string).trim()
  const descricao  = (formData.get('descricao')  as string).trim() || null
  const youtubeId  = (formData.get('youtube_id') as string).trim()
  const duracao    = (formData.get('duracao')    as string).trim() || null

  if (!titulo || !youtubeId || !ordem) return { error: 'Preencha todos os campos obrigatórios.' }

  const admin = createAdminClient()
  const payload = { ordem, titulo, descricao, youtube_id: youtubeId, duracao, updated_at: new Date().toISOString() }

  if (id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('treinamentos').update(payload).eq('id', id)
    if (error) return { error: 'Erro ao salvar.' }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('treinamentos').insert(payload)
    if (error) return { error: 'Erro ao criar.' }
  }

  revalidatePath('/treinamentos')
  revalidatePath('/admin/treinamentos')
  return {}
}

export async function excluirTreinamento(id: string): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('treinamentos').delete().eq('id', id)
  if (error) return { error: 'Erro ao excluir.' }

  revalidatePath('/treinamentos')
  revalidatePath('/admin/treinamentos')
  return {}
}
