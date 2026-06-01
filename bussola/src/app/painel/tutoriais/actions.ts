'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function marcarTutorialConcluido(tutorialId: string) {
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

    const { error } = await supabase
      .from('tutoriais_lidos')
      .upsert(
        { estabelecimento_id: est.id, tutorial_id: tutorialId },
        { onConflict: 'estabelecimento_id,tutorial_id', ignoreDuplicates: true }
      )
    if (error) {
      console.error('[marcarTutorialConcluido]', error)
      return { error: 'Não foi possível salvar.' }
    }

    revalidatePath('/painel/tutoriais')
    revalidatePath('/painel')
    return { ok: true as const }
  } catch (err) {
    console.error('[marcarTutorialConcluido]', err)
    return { error: 'Erro interno.' }
  }
}
