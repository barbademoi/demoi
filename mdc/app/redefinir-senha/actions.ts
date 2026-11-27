'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function trocarSenha(_: string | null, fd: FormData): Promise<string | null> {
  const senha = String(fd.get('senha') ?? '')
  const confirma = String(fd.get('confirma') ?? '')
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (senha !== confirma) return 'As duas senhas não estão iguais.'
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return 'O link expirou. Peça um novo em "Esqueci minha senha".'
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) return 'Não deu pra trocar a senha. Tenta de novo.'
  await supabase.auth.signOut()
  redirect('/entrar?ok=senha')
}
