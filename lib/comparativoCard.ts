/**
 * A LINHA DE COMPARATIVO DO CARD DE RANKING — só a decisão do que exibir.
 *
 * NÃO CALCULA NADA. O "mesmo período" já vem pronto de
 * `montarComparativoPeriodo`, que fatia o ciclo anterior com a régua única de
 * `lib/mesmoPeriodo.ts` — a mesma do comparativo geral da barbearia, dos
 * destaques do mês e do raio-x da reunião. Aqui só se lê `escopo.atual` e
 * `escopo.anterior` e se decide a frase.
 *
 * Isso é deliberado: uma segunda conta de "mesmo período", ainda que idêntica
 * hoje, viraria duas respostas diferentes na mesma tela no dia em que uma das
 * duas fosse ajustada. O card e a seção grande têm que concordar sempre.
 *
 * ── POR QUE SÓ R$, SEM PORCENTAGEM ──────────────────────────────────────────
 * Percentual exige dividir pelo mês passado, e o mês passado é justamente o que
 * pode ser zero (barbeiro que entrou agora). Em vez de proteger a divisão com
 * casos especiais, a linha não divide: mostra a diferença em reais, que é
 * definida para qualquer par de números.
 *
 * ── SEM HISTÓRICO ───────────────────────────────────────────────────────────
 * Duas situações diferentes, tratadas diferente:
 *   - a barbearia inteira não tem ciclo anterior (primeiro mês de uso) → a
 *     linha SOME de todos os cards. Repetir "sem histórico" em cada card seria
 *     ruído puro, e ninguém precisa ser lembrado disso doze vezes.
 *   - a barbearia tem, mas ESTE barbeiro não (entrou depois) → a linha aparece
 *     em estado neutro. Sem ela, o card dele pareceria quebrado ao lado dos
 *     outros, e o dono ficaria procurando o número que não existe.
 */
import type { EscopoComparativo } from './comparativoPeriodo'

/** Abaixo de meio centavo os dois lados são o mesmo número na tela. */
const EMPATE = 0.005

export type LinhaComparativa =
  | { tipo: 'oculta' }
  | { tipo: 'sem-historico'; texto: string }
  | {
    tipo: 'numero'
    /** "vs. mesmo período de ago" — ou "vs. ago" em ciclo já fechado. */
    rotulo: string
    /** Diferença com sinal (atual − mesmo ponto do ciclo anterior). */
    diferenca: number
    sentido: 'frente' | 'atras' | 'empate'
  }

export interface EntradaLinha {
  /** O escopo DESTE barbeiro, vindo de `comparativo.porBarbeiro[id]`. */
  escopo: EscopoComparativo | null | undefined
  /** Rótulo curto do ciclo anterior, já montado pelo comparativo ("ago"). */
  labelAnterior: string
  /** false = o dono navegou pra um ciclo fechado; ali compara-se ciclo cheio. */
  parcial: boolean
  /** Algum barbeiro tem ciclo anterior? Separa "barbearia nova" de "ele é novo". */
  haCicloAnterior: boolean
  /**
   * O card está exibindo R$? No modo só-pontos e no card de recepcionista o
   * valor principal não é dinheiro — comparar reais ali seria comparar uma
   * coisa que o card não mostra.
   */
  exibeValor: boolean
}

export function linhaComparativa(e: EntradaLinha): LinhaComparativa {
  if (!e.exibeValor) return { tipo: 'oculta' }
  if (!e.haCicloAnterior) return { tipo: 'oculta' }

  const anterior = e.escopo?.anterior ?? 0
  if (anterior <= 0) {
    return { tipo: 'sem-historico', texto: 'sem histórico ainda' }
  }

  const diferenca = (e.escopo?.atual ?? 0) - anterior
  const sentido = Math.abs(diferenca) < EMPATE
    ? 'empate' as const
    : diferenca > 0 ? 'frente' as const : 'atras' as const

  return {
    tipo: 'numero',
    // Em ciclo fechado não há "mesmo período": os dois estão inteiros, e dizer
    // "mesmo período" faria o dono achar que ainda há fatia parcial no meio.
    rotulo: e.parcial ? `vs. mesmo período de ${e.labelAnterior}` : `vs. ${e.labelAnterior}`,
    diferenca,
    sentido,
  }
}
