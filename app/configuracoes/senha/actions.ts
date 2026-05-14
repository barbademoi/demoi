'use server'

import { createClient } from '@/lib/supabase/server'

export async function trocarSenha(formData: FormData) {
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
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      console.error('[configuracoes/senha] erro ao atualizar senha:', error)
      return { error: 'Não foi possível salvar a senha. Tente novamente.' }
    }
  } catch (err) {
    console.error('[configuracoes/senha] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }

  return { ok: true }
}
