'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function trocarSenhaObrigatoria(formData: FormData) {
  const senha = formData.get('senha') as string
  const confirmacao = formData.get('confirmacao') as string

  if (senha !== confirmacao) {
    return { error: 'As senhas não coincidem.' }
  }
  if (senha.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

    const { error: errSenha } = await supabase.auth.updateUser({ password: senha })
    if (errSenha) {
      console.error('[redefinir-senha-obrigatoria] erro ao atualizar senha:', errSenha)
      return { error: 'Não foi possível salvar a senha. Tente novamente.' }
    }

    // Marca senha_temporaria = false
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('usuarios')
      .update({ senha_temporaria: false })
      .eq('id', user.id)

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[redefinir-senha-obrigatoria] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect('/dashboard')
}
