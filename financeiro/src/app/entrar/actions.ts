'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function entrar(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  try {
    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return { error: 'Email ou senha incorretos.' }
    }
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[entrar] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect('/app')
}
