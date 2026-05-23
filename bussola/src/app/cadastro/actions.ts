'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function cadastrar(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha email e senha.' }
  }
  if (password.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  }

  try {
    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        return { error: 'Já existe uma conta com esse email. Tente entrar.' }
      }
      return { error: 'Não foi possível criar a conta. Tente novamente.' }
    }

    // Sem sessão = confirmação de email habilitada no Supabase.
    if (!data.session) {
      return { ok: true, confirmar: true }
    }

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[cadastrar] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect('/onboarding')
}
