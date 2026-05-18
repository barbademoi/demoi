import { createAdminClient } from '@/lib/supabase/admin'

export type PlatformStats = {
  barbearias: number
  barbeiros: number
}

/**
 * Conta barbearias ativas e barbeiros ativos no banco.
 * Usa admin client porque a landing page é pública (sem auth).
 * Server-only — não importar em client components.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient()

  const [{ count: barbearias }, { count: barbeiros }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('barbearias')
      .select('id', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('barbeiros')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true),
  ])

  return {
    barbearias: barbearias ?? 0,
    barbeiros: barbeiros ?? 0,
  }
}
