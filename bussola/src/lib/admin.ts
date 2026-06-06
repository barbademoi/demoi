import { createClient } from '@/utils/supabase/server'

// Valida que o user logado é o admin do sistema (env var ADMIN_EMAIL).
// Retorna { ok, user, motivo? }. Endpoints e telas admin chamam isso
// como primeiro passo. Sem ADMIN_EMAIL configurado, ninguém entra.

export type AdminCheck =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; motivo: string }

export async function checkAdmin(): Promise<AdminCheck> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (!adminEmail) {
    return { ok: false, status: 503, motivo: 'admin_nao_configurado' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, motivo: 'nao_autenticado' }
  }
  if ((user.email ?? '').toLowerCase() !== adminEmail) {
    return { ok: false, status: 403, motivo: 'sem_permissao' }
  }
  return { ok: true, userId: user.id, email: user.email ?? '' }
}
