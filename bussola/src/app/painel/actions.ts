'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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
