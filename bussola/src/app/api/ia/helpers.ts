import { createClient } from '@/utils/supabase/server'
import { CONFIG_IA_PADRAO, type ConfigIA } from '@/lib/iaPrompts'

// Resolve o dono logado + seu estabelecimento (com config de IA).
export async function donoEstab() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, est: null as null | { id: string; config: ConfigIA } }

  const { data } = await supabase
    .from('estabelecimentos')
    .select('id, config_ia')
    .eq('dono_id', user.id)
    .maybeSingle()

  if (!data) return { supabase, est: null }

  const config = { ...CONFIG_IA_PADRAO, ...((data.config_ia as Partial<ConfigIA> | null) ?? {}) }
  return { supabase, est: { id: data.id as string, config } }
}
