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

  // Supabase pode gerar OTP de 6 OU 8 dígitos dependendo da config do projeto.
  // Aceita ambos e deixa o verifyOtp validar de fato — o check aqui é só UX.
  if (codigoLimpo.length !== 6 && codigoLimpo.length !== 8) {
    return { error: 'Digite o código que você recebeu por email.' }
  }
  if (!emailNormalizado) {
    return { error: 'Email não informado. Volte e tente de novo.' }
  }

  const supabase = createClient()

  // Tenta type 'email' primeiro; se Supabase tratou o envio como magic link
  // (template usa {{ .Token }} mas tabela interna marca como magiclink),
  // o fallback resolve sem o usuário perceber.
  const tentativas: Array<'email' | 'magiclink'> = ['email', 'magiclink']
  let ultimoErro: string | null = null

  for (const type of tentativas) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailNormalizado,
        token: codigoLimpo,
        type,
      })

      if (!error) {
        // Sucesso — sai do server action via redirect
        redirect('/redefinir-senha')
      }

      ultimoErro = error.message
      console.warn('[esqueci-senha] verifyOtp type=%s falhou: %s', type, error.message)
    } catch (err) {
      // redirect() levanta exceção própria do Next que NÃO devemos engolir
      if (err && typeof err === 'object' && 'digest' in err) throw err
      console.error('[esqueci-senha] erro inesperado verifyOtp type=%s:', type, err)
      ultimoErro = err instanceof Error ? err.message : String(err)
    }
  }

  if (ultimoErro && /expired/i.test(ultimoErro) && !/invalid/i.test(ultimoErro)) {
    return { error: 'Código expirou. Clique em "Não recebi" para receber outro.' }
  }
  return { error: 'Código incorreto. Verifique e tente de novo.' }
}
