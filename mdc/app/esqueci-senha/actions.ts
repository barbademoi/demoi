'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function pedirLink(_: string | null, fd: FormData): Promise<string | null> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  if (!email) return 'erro:Coloca seu e-mail.'
  const h = headers()
  const origem = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
  const supabase = createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?next=/redefinir-senha`,
  })
  // Mesma resposta exista ou não a conta (não revela quem é cliente).
  return 'ok'
}
