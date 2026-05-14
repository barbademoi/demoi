'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function salvarIdentidade(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string } | null }

  if (!usuario) redirect('/login')

  const nome = (formData.get('nome') as string).trim().slice(0, 60)
  const cidade = (formData.get('cidade') as string).trim()
  const cor_principal = (formData.get('cor_principal') as string) || '#2563EB'

  if (!nome || !cidade) return { error: 'Nome e cidade são obrigatórios.' }

  const updates: Record<string, unknown> = { nome, cidade, cor_principal }

  // Logo upload via File (se enviado)
  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    try {
      const admin = createAdminClient()
      const ext = logoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `logos/${usuario.barbearia_id}/logo.${ext}`
      const bytes = await logoFile.arrayBuffer()
      await admin.storage.from('fotos').upload(path, bytes, {
        upsert: true,
        contentType: logoFile.type,
      })
      const { data: { publicUrl } } = admin.storage.from('fotos').getPublicUrl(path)
      updates.logo_url = publicUrl
    } catch (err) {
      console.error('[onboarding/passo-1] erro upload logo:', err)
      // logo é opcional, não bloqueia
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias')
    .update(updates)
    .eq('id', usuario.barbearia_id)

  if (error) {
    console.error('[onboarding/passo-1] erro ao salvar:', error)
    return { error: 'Erro ao salvar. Tente novamente.' }
  }

  redirect('/onboarding/passo-2')
}
