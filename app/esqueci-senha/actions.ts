'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function solicitarCodigo(formData: FormData) {
  const email = (formData.get('email') as string ?? '').toLowerCase().trim()

  if (!email) {
    return { error: 'Informe seu email.' }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (error) {
      // Rate limit do Supabase: "For security purposes, you can only request this after X seconds"
      if (/security purposes|rate|seconds/i.test(error.message)) {
        return { error: 'Aguarde alguns segundos antes de pedir outro código.' }
      }
      // Email não cadastrado / outros erros: log mas não revela ao usuário
      console.warn('[esqueci-senha] signInWithOtp falhou:', error.message)
    }
  } catch (err) {
    console.error('[esqueci-senha] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  // Sempre sucesso (não revela se email existe)
  return { ok: true }
}

export async function verificarCodigo(email: string, codigo: string) {
  const emailNormalizado = email.toLowerCase().trim()
  const codigoLimpo = codigo.replace(/\D/g, '')

  if (codigoLimpo.length !== 6) {
    return { error: 'Digite os 6 dígitos do código.' }
  }
  if (!emailNormalizado) {
    return { error: 'Email não informado. Volte e tente de novo.' }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: emailNormalizado,
      token: codigoLimpo,
      type: 'email',
    })

    if (error) {
      console.warn('[esqueci-senha] verifyOtp falhou:', error.message)
      if (/expired/i.test(error.message)) {
        return { error: 'Código expirou. Clique em "Não recebi" para receber outro.' }
      }
      return { error: 'Código incorreto. Verifique e tente de novo.' }
    }
  } catch (err) {
    console.error('[esqueci-senha] erro inesperado em verifyOtp:', err)
    return { error: 'Não foi possível validar. Tente novamente.' }
  }

  redirect('/redefinir-senha')
}
