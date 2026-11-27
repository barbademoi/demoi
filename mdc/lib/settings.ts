import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Lê uma configuração com o cliente do usuário (respeita a visibilidade do
 * RLS) e completa com o padrão. Se a linha não existir ou o banco falhar, a
 * página continua de pé com o texto padrão.
 */
export async function lerConfig<T>(key: string, padrao: T): Promise<T> {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
    return mesclar(padrao, data?.value)
  } catch {
    return padrao
  }
}

/** Objeto: campo a campo (texto vazio não apaga o padrão). Outros tipos: valor salvo, se houver. */
export function mesclar<T>(padrao: T, salvo: unknown): T {
  if (salvo === null || salvo === undefined) return padrao
  if (typeof padrao === 'object' && padrao !== null && !Array.isArray(padrao)) {
    if (typeof salvo !== 'object' || Array.isArray(salvo)) return padrao
    const out: Record<string, unknown> = { ...(padrao as Record<string, unknown>) }
    for (const [k, v] of Object.entries(salvo as Record<string, unknown>)) {
      if (v === '' || v === null || v === undefined) continue
      if (Array.isArray(v) && v.length === 0) continue
      out[k] = v
    }
    return out as T
  }
  if (typeof padrao === 'string') return (typeof salvo === 'string' && salvo.trim() ? salvo : padrao) as T
  return salvo as T
}
