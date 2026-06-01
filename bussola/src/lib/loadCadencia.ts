import type { SupabaseClient } from '@supabase/supabase-js'
import type { CadenciaConfig, Cadencia } from './cadencia'

// Carrega cfg de cadência resiliente: se a migration 017 não rodou,
// usa defaults compatíveis com o comportamento antigo (semanal).
export async function loadCadenciaConfig(
  supabase: SupabaseClient,
  estabelecimentoId: string
): Promise<CadenciaConfig> {
  // Primeira tentativa: select completo (colunas novas).
  const novo = await supabase
    .from('estabelecimentos')
    .select('cadencia_reuniao, dia_reuniao, hora_reuniao, dia_mes_reuniao, incluir_domingos')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  if (novo.data) {
    return {
      cadencia: ((novo.data.cadencia_reuniao as string) ?? 'semanal') as Cadencia,
      dia_reuniao: (novo.data.dia_reuniao as number | null) ?? 1,
      hora_reuniao: (novo.data.hora_reuniao as string | null) ?? '09:00',
      dia_mes_reuniao: (novo.data.dia_mes_reuniao as number | null) ?? null,
      incluir_domingos: !!novo.data.incluir_domingos,
    }
  }
  // Fallback: colunas antigas.
  const antigo = await supabase
    .from('estabelecimentos')
    .select('dia_reuniao, hora_reuniao')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  return {
    cadencia: 'semanal',
    dia_reuniao: (antigo.data?.dia_reuniao as number | null) ?? 1,
    hora_reuniao: (antigo.data?.hora_reuniao as string | null) ?? '09:00',
    dia_mes_reuniao: null,
    incluir_domingos: false,
  }
}

// Última reunião concluída — usado pra calcular quinzenal.
export async function ultimaReuniaoConcluidaIso(
  supabase: SupabaseClient,
  estabelecimentoId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('reunioes')
    .select('data_reuniao')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'concluida')
    .order('data_reuniao', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.data_reuniao as string | null) ?? null
}
