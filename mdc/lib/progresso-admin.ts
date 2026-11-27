import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * % de missões do mês de cada membro (função do banco criada na fase 3).
 * Antes da fase 3 a função não existe: devolve vazio e a tela mostra "—".
 */
export async function progressoMesTodos(admin: SupabaseClient, membros: { id: string }[]): Promise<Record<string, number>> {
  if (!membros.length) return {}
  const { data, error } = await admin.rpc('mdc_progresso_mes_todos')
  if (error || !data) return {}
  const out: Record<string, number> = {}
  for (const row of data as { member_id: string; percentual: number }[]) out[row.member_id] = row.percentual
  return out
}
