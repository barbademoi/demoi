import type { SupabaseClient } from '@supabase/supabase-js'

export interface MesFechadoInfo {
  fechado: boolean
  fechadoEm: string | null
}

/**
 * Verifica se um (barbearia, mes, ano) está marcado como fechado.
 * Usado pelas save-actions (salvarMetas, salvarCampanha, salvarComandasDia,
 * definirAcumuladoMes) pra bloquear edição quando fechado.
 */
export async function estaFechado(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  barbeariaId: string,
  mes: number,
  ano: number,
): Promise<MesFechadoInfo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('meses_fechados')
    .select('fechado_em')
    .eq('barbearia_id', barbeariaId)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle() as { data: { fechado_em: string } | null }

  return {
    fechado: !!data,
    fechadoEm: data?.fechado_em ?? null,
  }
}
