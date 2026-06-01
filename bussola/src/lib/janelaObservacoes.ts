import type { SupabaseClient } from '@supabase/supabase-js'

export interface JanelaObservacoes {
  inicio: Date
  fim: Date
}

// Janela de observações desde a última reunião concluída até agora.
// Se não há reunião concluída, usa created_at da empresa como início.
export async function janelaObservacoesAtual(
  supabase: SupabaseClient,
  estabelecimentoId: string
): Promise<JanelaObservacoes> {
  const fim = new Date()

  const { data: ult } = await supabase
    .from('reunioes')
    .select('data_reuniao')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'concluida')
    .order('data_reuniao', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ult?.data_reuniao) {
    return { inicio: new Date(ult.data_reuniao as string), fim }
  }

  // Fallback: created_at do estabelecimento.
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('created_at')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  const inicio = est?.created_at
    ? new Date(est.created_at as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // último mês como fallback final
  return { inicio, fim }
}
