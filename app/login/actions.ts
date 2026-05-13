'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  // Keep redirect() outside try/catch — Next.js requires it to propagate
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) {
      return { error: 'Email ou senha incorretos.' }
    }
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[login] unexpected error:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }
  redirect('/dashboard')
}

export async function logout() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[logout] unexpected error:', err)
  }
  redirect('/login')
}
