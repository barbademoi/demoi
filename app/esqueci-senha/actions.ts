'use server'

import { createClient } from '@/lib/supabase/server'

export async function solicitarResetSenha(formData: FormData) {
  const email = (formData.get('email') as string).toLowerCase().trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barbermeta.vercel.app'

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
    })

    if (error) {
      console.error('[esqueci-senha] erro ao enviar reset:', error)
      return { error: 'Não foi possível enviar o email. Tente novamente.' }
    }
  } catch (err) {
    console.error('[esqueci-senha] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  // Sempre retorna sucesso para não revelar se o email existe
  return { ok: true }
}
