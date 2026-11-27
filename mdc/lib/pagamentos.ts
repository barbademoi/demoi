import { diasEntre, somarMeses } from '@/lib/format'

/** Até quantos dias de atraso a renovação continua do vencimento antigo. */
export const TOLERANCIA_RENOVACAO = 15

/**
 * Calcula o novo período quando um pagamento é confirmado.
 * - Primeira vez: começa na data de início escolhida (padrão = data do pagamento).
 * - Renovação: continua do vencimento atual (mesmo pagando antes, ou com até
 *   15 dias de atraso). Atraso maior: recomeça na data do pagamento.
 */
export function calcularPeriodo({
  dataInicioAtual,
  vencimentoAtual,
  pagoEm,
  inicioEscolhido,
  meses,
}: {
  dataInicioAtual: string | null
  vencimentoAtual: string | null
  pagoEm: string
  inicioEscolhido?: string | null
  meses: number
}): { dataInicio: string; periodoInicio: string; vencimento: string; primeiraVez: boolean } {
  if (!dataInicioAtual) {
    const inicio = inicioEscolhido || pagoEm
    return { dataInicio: inicio, periodoInicio: inicio, vencimento: somarMeses(inicio, meses), primeiraVez: true }
  }
  const base = vencimentoAtual && diasEntre(vencimentoAtual, pagoEm) <= TOLERANCIA_RENOVACAO ? vencimentoAtual : pagoEm
  return { dataInicio: dataInicioAtual, periodoInicio: base, vencimento: somarMeses(base, meses), primeiraVez: false }
}
