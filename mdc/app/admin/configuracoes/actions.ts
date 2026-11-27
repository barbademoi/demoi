'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { CHAVES_CONFIG, type ChaveConfig } from '@/lib/chaves'

export async function salvarConfig(key: string, value: unknown): Promise<{ ok: boolean; erro?: string }> {
  try {
    const { supabase } = await assertAdmin()
    if (!(key in CHAVES_CONFIG)) return { ok: false, erro: 'Configuração desconhecida.' }
    const visibilidade = CHAVES_CONFIG[key as ChaveConfig]
    const { error } = await supabase.from('settings').upsert({ key, value, visibilidade }, { onConflict: 'key' })
    if (error) return { ok: false, erro: error.message }
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
