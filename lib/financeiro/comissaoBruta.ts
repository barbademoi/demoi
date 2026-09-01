// Regras da EDIÇÃO DE COMISSÃO BRUTA feita pelo módulo Financeiro.
//
// Ficam separadas da server action de propósito: são elas que decidem em qual
// ciclo o valor cai e em qual coluna ele é gravado — a parte que, errada, faz
// um ajuste de setembro aparecer em agosto ou sumir do ranking. Aqui elas são
// funções puras, exercitáveis sem banco.
//
// A régua é a mesma do lançamento diário (definirAcumuladoMes): o par
// (mes, ano) é o do CICLO da barbearia, `valorBase()` diz se o número é
// faturamento ou comissão, e `comissao_acumulada` espelha o valor base, que é
// a coluna que o ranking lê.

import type { BaseMeta } from '@/lib/modoMeta'

/**
 * 'YYYY-MM' → (mes, ano).
 *
 * Esse par NÃO é o mês do calendário: é o mesmo identificador de ciclo que
 * `lancamentos` usa e que `buscarComissoesBarbermeta` devolve em `mesAno`,
 * já resolvido a partir do dia_fechamento da barbearia. Numa barbearia que
 * fecha dia 26, o ciclo "2026-09" vai de 26/08 a 25/09 — o rótulo é o mesmo
 * dos dois lados, e é por isso que a edição cai no ciclo que o dono está
 * vendo na tela e não no de hoje.
 */
export function mesAnoDoYm(ym: string): { mes: number; ano: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym ?? ''))
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  if (mes < 1 || mes > 12) return null
  if (ano < 2000 || ano > 2100) return null
  return { mes, ano }
}

/** Valor em reais, nunca negativo, arredondado aos centavos que a coluna guarda. */
export function normalizarValor(v: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
  return Math.round(v * 100) / 100
}

/**
 * A linha de upsert em `lancamentos`, no mesmo formato que o lançamento diário
 * grava.
 *
 * Escreve a coluna do valor base E espelha em `comissao_acumulada`. As colunas
 * ausentes ficam como estão no banco — `numero_atendimentos`, em particular,
 * não é tocado por uma edição de dinheiro (e tem default 0 pra linha nova).
 */
export function linhaLancamentoAjuste(params: {
  base: BaseMeta
  barbeariaId: string
  barbeiroId: string
  mes: number
  ano: number
  valor: number
}): Record<string, unknown> {
  const { base, barbeariaId, barbeiroId, mes, ano, valor } = params
  const row: Record<string, unknown> = {
    barbearia_id: barbeariaId,
    barbeiro_id: barbeiroId,
    mes,
    ano,
    comissao_acumulada: valor,
    modo: 'direto',
  }
  if (base === 'faturamento') row.valor_faturamento = valor
  else row.valor_comissao = valor
  return row
}
