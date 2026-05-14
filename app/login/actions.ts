'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  let senhaTemporaria = false
  let onboardingPendente = false

  try {
    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) {
      return { error: 'Email ou senha incorretos.' }
    }

    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usuarioRaw } = await (supabase as any)
        .from('usuarios')
        .select('senha_temporaria, barbearias(onboarding_completo)')
        .eq('id', data.user.id)
        .maybeSingle()

      senhaTemporaria = usuarioRaw?.senha_temporaria === true
      onboardingPendente = usuarioRaw?.barbearias?.onboarding_completo === false
    }

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[login] unexpected error:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  if (senhaTemporaria) {
    redirect('/redefinir-senha-obrigatoria')
  }

  if (onboardingPendente) {
    cookies().set('onboarding_required', '1', { path: '/', httpOnly: true, sameSite: 'lax' })
    redirect('/onboarding/passo-1')
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
