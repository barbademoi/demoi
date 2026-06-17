'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function cadastrar(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Preencha email e senha.' }
  if (password.length < 6) return { error: 'A senha precisa ter ao menos 6 caracteres.' }

  let precisaConfirmar = false

  try {
    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({ email, password })

    if (error) {
      // Mensagem amigável pros casos mais comuns.
      if (/registered|already/i.test(error.message)) {
        return { error: 'Esse email já tem conta. Tente entrar.' }
      }
      return { error: 'Não foi possível criar a conta. Tente novamente.' }
    }

    // Sem sessão = projeto exige confirmação de email.
    precisaConfirmar = !data.session

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[cadastro] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect(precisaConfirmar ? '/entrar?msg=confirme_email' : '/app')
}
