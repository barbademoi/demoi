'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function redefinirSenha(formData: FormData) {
  const senha = formData.get('senha') as string
  const confirmar = formData.get('confirmar') as string

  if (!senha || senha.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  }
  if (senha !== confirmar) {
    return { error: 'As senhas não coincidem.' }
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Link expirado ou inválido. Solicite um novo.' }
    }

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      return { error: 'Não foi possível atualizar a senha. Tente novamente.' }
    }

    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[redefinirSenha] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  redirect('/painel')
}
