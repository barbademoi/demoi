// Contagem client-side de mensagens de conduta NÃO LIDAS pelo dono.
// Usa o browser client com a sessão do dono — a RLS (barbearia_id =
// get_barbearia_id()) já escopa pra barbearia dele. Conta só mensagens
// IDENTIFICADAS do barbeiro ainda não lidas (anônimas não têm check).

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function contarCondutaNaoLidas(): Promise<number> {
  const { count, error } = await supabase
    .from('mensagens_conduta')
    .select('id', { count: 'exact', head: true })
    .eq('autor', 'barbeiro')
    .eq('anonima', false)
    .is('lida_em', null)
  if (error) {
    // Tabela pode não existir ainda (migration não rodada) — sem badge, sem ruído.
    return 0
  }
  return count ?? 0
}
