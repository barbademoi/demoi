'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function definirSenha(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email       = (formData.get('email')            as string ?? '').toLowerCase().trim()
  const transaction = (formData.get('hotmart_transaction') as string ?? '').trim()
  const novaSenha   = (formData.get('nova_senha')        as string ?? '')
  const confirmar   = (formData.get('confirmar_senha')   as string ?? '')

  if (!email || !transaction) return { error: 'Link inválido.' }
  if (novaSenha.length < 8)   return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  if (novaSenha !== confirmar) return { error: 'As senhas não conferem.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (admin as any)
    .from('usuarios')
    .select('id, senha_definida')
    .eq('email', email)
    .eq('hotmart_transaction', transaction)
    .maybeSingle()

  if (!usuario) return { error: 'Link inválido ou expirado.' }
  if (usuario.senha_definida) return { error: 'Senha já foi definida. Use o login.' }

  const { error: errAuth } = await admin.auth.admin.updateUserById(usuario.id, {
    password: novaSenha,
  })
  if (errAuth) {
    console.error('[boas-vindas] erro updateUserById:', errAuth)
    return { error: 'Erro ao definir senha. Tente novamente.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('usuarios')
    .update({ senha_definida: true })
    .eq('id', usuario.id)

  const supabase = createClient()
  const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password: novaSenha })

  if (errLogin) {
    console.error('[boas-vindas] erro signIn após definir senha:', errLogin)
    redirect('/login?msg=senha_criada')
  }

  cookies().set('onboarding_required', '1', { path: '/', httpOnly: true, sameSite: 'lax' })
  redirect('/onboarding/passo-1')
}
