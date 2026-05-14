'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  let senhaTemporaria = false

  try {
    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) {
      return { error: 'Email ou senha incorretos.' }
    }

    // Verifica se é o primeiro acesso (senha temporária do webhook)
    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usuario } = await (supabase as any)
        .from('usuarios')
        .select('senha_temporaria')
        .eq('id', data.user.id)
        .maybeSingle()
      senhaTemporaria = usuario?.senha_temporaria === true
    }

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[login] unexpected error:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect(senhaTemporaria ? '/redefinir-senha-obrigatoria' : '/dashboard')
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
