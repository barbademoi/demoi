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

function calcularPeriodos(mesAtual: number, anoAtual: number, quantidade: number) {
  const periodos: { mes: number; ano: number }[] = []
  for (let i = quantidade - 1; i >= 0; i--) {
    let m = mesAtual - i
    let a = anoAtual
    while (m <= 0) { m += 12; a -= 1 }
    periodos.push({ mes: m, ano: a })
  }
  return periodos
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buscarHistoricoMeses(
  supabase: any, // SupabaseClient — tipagem fraca pra evitar friction com `as any` que o resto do código usa
  barbeiroId: string,
  mesAtual: number,
  anoAtual: number,
  quantidade = 4,
): Promise<HistoricoMes[]> {
  const periodos = calcularPeriodos(mesAtual, anoAtual, quantidade)

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

/**
 * Busca histórico agregado da barbearia inteira (soma de todos os barbeiros).
 *
 * Lógica:
 * - Pra cada mês: comissao = SUM(lancamentos.comissao_acumulada) de todos os
 *   barbeiros. Se metas.faturamento_acumulado existe e é > 0, usa esse valor
 *   (que pode ser editado manualmente pelo dono via FaturamentoEdit).
 * - atendimentos = SUM(lancamentos.numero_atendimentos) de todos os barbeiros.
 *
 * Usado no dashboard pra exibir comparativo/histórico/ticket médio da
 * barbearia inteira (visão "Todos" no modo equipe).
 */
export async function buscarHistoricoBarbearia(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  barbeariaId: string,
  mesAtual: number,
  anoAtual: number,
  quantidade = 4,
): Promise<HistoricoMes[]> {
  const periodos = calcularPeriodos(mesAtual, anoAtual, quantidade)

  // Em paralelo: pra cada mês, busca SUM(lancamentos) e meta.faturamento_acumulado
  const queries = periodos.flatMap(p => [
    supabase
      .from('lancamentos')
      .select('comissao_acumulada, numero_atendimentos')
      .eq('barbearia_id', barbeariaId)
      .eq('mes', p.mes)
      .eq('ano', p.ano),
    supabase
      .from('metas')
      .select('faturamento_acumulado, numero_atendimentos')
      .eq('barbearia_id', barbeariaId)
      .eq('mes', p.mes)
      .eq('ano', p.ano)
      .maybeSingle(),
  ])

  const results = await Promise.all(queries)

  return periodos.map((p, i) => {
    const lancRows = (results[i * 2]?.data ?? []) as { comissao_acumulada: number; numero_atendimentos: number }[]
    const metaData = results[i * 2 + 1]?.data as { faturamento_acumulado: number; numero_atendimentos: number } | null

    const somaComissoes = lancRows.reduce((s, r) => s + (Number(r.comissao_acumulada) || 0), 0)
    const fatManual = Number(metaData?.faturamento_acumulado) || 0
    const comissao = fatManual > 0 ? fatManual : somaComissoes

    const somaAtendBarbeiros = lancRows.reduce((s, r) => s + (Number(r.numero_atendimentos) || 0), 0)
    const atendManual = Number(metaData?.numero_atendimentos) || 0
    // Mesmo critério do faturamento: prefere o valor da meta quando preenchido
    const atendimentos = atendManual > 0 ? atendManual : somaAtendBarbeiros

    return { mes: p.mes, ano: p.ano, comissao, atendimentos }
  })
}

/**
 * Busca histórico em batch pra múltiplos barbeiros — usado no dashboard
 * pra exibir comparativo/histórico/ticket médio quando o dono filtra
 * por um barbeiro específico (qualquer modalidade).
 *
 * Retorna Record<barbeiroId, HistoricoMes[]> com os períodos sempre na
 * mesma ordem (do mais antigo pro mais recente). Barbeiros sem nenhum
 * lançamento ainda aparecem no map com array de zeros.
 */
export async function buscarHistoricoMesesPorBarbeiros(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  barbeiroIds: string[],
  mesAtual: number,
  anoAtual: number,
  quantidade = 4,
): Promise<Record<string, HistoricoMes[]>> {
  if (barbeiroIds.length === 0) return {}

  const periodos = calcularPeriodos(mesAtual, anoAtual, quantidade)

  const queries = periodos.map(p =>
    supabase
      .from('lancamentos')
      .select('barbeiro_id, comissao_acumulada, numero_atendimentos')
      .in('barbeiro_id', barbeiroIds)
      .eq('mes', p.mes)
      .eq('ano', p.ano)
  )

  const results = await Promise.all(queries)

  const out: Record<string, HistoricoMes[]> = {}
  for (const id of barbeiroIds) {
    out[id] = periodos.map(p => ({ mes: p.mes, ano: p.ano, comissao: 0, atendimentos: 0 }))
  }

  results.forEach((res, periodoIdx) => {
    const rows = (res?.data ?? []) as { barbeiro_id: string; comissao_acumulada: number; numero_atendimentos: number }[]
    for (const r of rows) {
      const arr = out[r.barbeiro_id]
      if (arr && arr[periodoIdx]) {
        arr[periodoIdx].comissao = Number(r.comissao_acumulada) || 0
        arr[periodoIdx].atendimentos = Number(r.numero_atendimentos) || 0
      }
    }
  })

  return out
}
