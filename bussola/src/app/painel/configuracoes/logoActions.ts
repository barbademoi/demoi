'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function salvarLogoUrl(url: string | null) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const { error } = await supabase
      .from('estabelecimentos')
      .update({ logo_url: url })
      .eq('dono_id', user.id)
    if (error) return { error: 'Não foi possível salvar.' }

    revalidatePath('/painel/configuracoes')
    revalidatePath('/painel')
    revalidatePath('/painel', 'layout')
    return { ok: true as const }
  } catch (err) {
    console.error('[salvarLogoUrl]', err)
    return { error: 'Erro interno.' }
  }
}

export async function removerLogo() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const { data: est } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!est) return { error: 'Sem empresa.' }

    // Remove os arquivos do storage (todos da pasta da empresa).
    const { data: arquivos } = await supabase.storage
      .from('empresas-logos')
      .list(est.id as string)
    if (arquivos && arquivos.length > 0) {
      const paths = arquivos.map((a) => `${est.id}/${a.name}`)
      await supabase.storage.from('empresas-logos').remove(paths)
    }

    const { error } = await supabase
      .from('estabelecimentos')
      .update({ logo_url: null })
      .eq('id', est.id)
    if (error) return { error: 'Não foi possível remover.' }

    revalidatePath('/painel/configuracoes')
    revalidatePath('/painel')
    revalidatePath('/painel', 'layout')
    return { ok: true as const }
  } catch (err) {
    console.error('[removerLogo]', err)
    return { error: 'Erro interno.' }
  }
}
