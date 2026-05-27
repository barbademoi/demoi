'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function marcarHomeVista() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('estabelecimentos')
      .update({ ultima_visita_home: new Date().toISOString() })
      .eq('dono_id', user.id)
  } catch (err) {
    console.error('[marcarHomeVista]', err)
  }
}

export async function sair() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[sair] erro inesperado:', err)
  }
  redirect('/entrar')
}
