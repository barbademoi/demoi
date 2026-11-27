'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function entrar(_: string | null, fd: FormData): Promise<string | null> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const senha = String(fd.get('senha') ?? '')
  const next = String(fd.get('next') ?? '')
  if (!email || !senha) return 'Coloca o e-mail e a senha.'

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return 'E-mail ou senha não conferem.'

  // Só aceita destino interno (evita redirecionar para outro site).
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/inicio'
  redirect(destino)
}
