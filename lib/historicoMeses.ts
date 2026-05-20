/**
 * Busca a comissão acumulada de um barbeiro nos últimos N meses (incluindo o atual).
 * Retorna ordenado do mais antigo pro mais recente.
 * Usado pelas features de comparativo e histórico do modo autônomo.
 */

export type HistoricoMes = {
  mes: number
  ano: number
  comissao: number
  atendimentos: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buscarHistoricoMeses(
  supabase: any, // SupabaseClient — tipagem fraca pra evitar friction com `as any` que o resto do código usa
  barbeiroId: string,
  mesAtual: number,
  anoAtual: number,
  quantidade = 4,
): Promise<HistoricoMes[]> {
  const periodos: { mes: number; ano: number }[] = []
  for (let i = quantidade - 1; i >= 0; i--) {
    let m = mesAtual - i
    let a = anoAtual
    while (m <= 0) { m += 12; a -= 1 }
    periodos.push({ mes: m, ano: a })
  }

  const queries = periodos.map(p =>
    supabase
      .from('lancamentos')
      .select('comissao_acumulada, numero_atendimentos')
      .eq('barbeiro_id', barbeiroId)
      .eq('mes', p.mes)
      .eq('ano', p.ano)
      .maybeSingle()
  )

  const results = await Promise.all(queries)

  return periodos.map((p, i) => ({
    mes: p.mes,
    ano: p.ano,
    comissao: (results[i]?.data?.comissao_acumulada as number | undefined) ?? 0,
    atendimentos: (results[i]?.data?.numero_atendimentos as number | undefined) ?? 0,
  }))
}
