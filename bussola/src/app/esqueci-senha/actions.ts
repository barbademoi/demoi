'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function solicitarReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Informe seu email.' }
  }

  try {
    const supabase = createClient()
    const origin = headers().get('origin') ?? ''

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
    })

    // Resposta genérica de propósito — não revela se o email existe.
    return { ok: true }
  } catch (err) {
    console.error('[solicitarReset] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }
}
