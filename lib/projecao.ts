/**
 * PROJEÇÃO DE FECHAMENTO DO CICLO — estatística local, sem IA e sem rede.
 *
 * ── O PROBLEMA, E POR QUE A SOLUÇÃO ÓBVIA NÃO SERVE ─────────────────────────
 * O caminho natural seria aprender a curva de R$ dia a dia. Não dá: o
 * lançamento diário registra COMANDAS, não dinheiro (ver
 * `app/dashboard/lancamento-diario/actions.ts`, que diz isso em letras
 * maiúsculas). O R$ por dia só existe em barbearia que usa a extensão do
 * Agenda Serviço — hoje, uma. Um modelo que dependesse disso não funcionaria
 * para praticamente ninguém.
 *
 * ── A IDEIA ─────────────────────────────────────────────────────────────────
 * Separar FORMA de NÍVEL.
 *   - FORMA: que fração do trabalho do ciclo já foi feita até o dia D. Isso se
 *     aprende das COMANDAS, que todo mundo tem, dia a dia, há ciclos.
 *   - NÍVEL: quanto isso vale em R$. Vem do acumulado do ciclo, que todo mundo
 *     também tem.
 * Projeção = acumulado ÷ fração já realizada.
 *
 * A fração aprendida das comandas é muito melhor que a fração do calendário:
 * ela já embute sábado cheio, segunda fraca, folga do barbeiro e feriado — sem
 * precisar modelar nada disso explicitamente.
 *
 * ── OS TRÊS ESTIMADORES ─────────────────────────────────────────────────────
 *   A (ritmo)     — fração pelo calendário/dias de trabalho. É o que o sistema
 *                   já fazia, e vira o piso: funciona sem histórico nenhum.
 *   B (padrão)    — fração MEDIANA dos ciclos fechados no mesmo ponto. Robusta
 *                   a ciclo atípico por ser mediana, não média.
 *   C (tendência) — total do ciclo anterior corrigido pelo crescimento mediano
 *                   entre ciclos. Não depende do acumulado de hoje, então é o
 *                   único que diz algo útil no dia 2.
 *
 * O peso de C cai com o andamento do ciclo; A e B sobem. No fim do ciclo a
 * projeção converge para o próprio acumulado, como tem que ser.
 *
 * ── O QUE ESTA FUNÇÃO NÃO FAZ ───────────────────────────────────────────────
 * Não chama IA, não acessa rede, não lê banco. Recebe números, devolve números.
 * E o resultado é SÓ INFORMATIVO: não alimenta premiação, folha, ranking nem
 * meta — nada aqui é escrito em lugar nenhum.
 */

export type Confianca = 'alta' | 'media' | 'baixa'

export interface CicloHistorico {
  mes: number
  ano: number
  /** Total do ciclo no campo-base da barbearia (R$). */
  total: number
  /** Comandas por dia do ciclo, índice 0 = primeiro dia. */
  comandasPorDia: number[]
  /** Dias que o ciclo teve (28–31, conforme dia_fechamento). */
  totalDias: number
}

export interface EntradaProjecao {
  /** Acumulado de hoje no ciclo corrente (R$). */
  atual: number
  /** Dias decorridos do ciclo corrente, contando hoje (1 = primeiro dia). */
  diasDecorridos: number
  /** Dias que o ciclo corrente terá no total. */
  totalDias: number
  /** Comandas por dia do ciclo CORRENTE, até hoje. */
  comandasPorDiaAtual: number[]
  /** Ciclos FECHADOS anteriores, do mais antigo ao mais recente. */
  historico: CicloHistorico[]
  /** Dias de trabalho do barbeiro no mês (null = usa o calendário). */
  diasTrabalhoMes: number | null
}

export interface Projecao {
  /** Valor esperado de fechamento (R$). */
  esperado: number
  /** Faixa conservador → otimista. null quando não há dispersão pra medir. */
  faixa: { conservador: number; otimista: number } | null
  confianca: Confianca
  /** Frases curtas explicando a confiança. Sempre pelo menos uma. */
  motivos: string[]
  /** Quantos ciclos entraram no padrão depois dos descartes. */
  ciclosUsados: number
  /** Dias do ciclo atual, até hoje, sem nenhuma comanda lançada. */
  diasSemLancamento: number
  /** false = não há base pra projetar (barbeiro novo, ciclo zerado). */
  temProjecao: boolean
}

// ── Estatística miúda ───────────────────────────────────────────────────────

export function mediana(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Percentil por interpolação linear. p em 0..1. */
export function percentil(xs: number[], p: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  if (s.length === 1) return s[0]
  const pos = (s.length - 1) * Math.min(1, Math.max(0, p))
  const baixo = Math.floor(pos)
  const alto = Math.ceil(pos)
  if (baixo === alto) return s[baixo]
  return s[baixo] + (s[alto] - s[baixo]) * (pos - baixo)
}

/**
 * Ciclo atípico sai do padrão. Critério de Tukey (1,5 × IQR) sobre os totais:
 * mês de reforma, barbeiro afastado, mês de pico isolado — qualquer um deles
 * puxaria a fração típica pro lado errado.
 */
export function semOutliers(ciclos: CicloHistorico[]): CicloHistorico[] {
  if (ciclos.length < 4) return ciclos
  const totais = ciclos.map((c) => c.total)
  const q1 = percentil(totais, 0.25)
  const q3 = percentil(totais, 0.75)
  const iqr = q3 - q1
  if (iqr <= 0) return ciclos
  const min = q1 - 1.5 * iqr
  const max = q3 + 1.5 * iqr
  const filtrados = ciclos.filter((c) => c.total >= min && c.total <= max)
  // Nunca descarta a ponto de ficar sem padrão.
  return filtrados.length >= 2 ? filtrados : ciclos
}

/** Dias com pelo menos uma comanda lançada. */
export function diasComLancamento(comandas: number[]): number {
  return comandas.filter((q) => q > 0).length
}

/**
 * Ciclo BEM ALIMENTADO: tem comandas na maior parte dos dias que deveriam ter
 * movimento. A régua é 60% dos dias do ciclo — folga de 1 dia por semana cabe
 * dentro disso, mas um ciclo lançado só na primeira semana não passa.
 */
export function bemAlimentado(c: CicloHistorico): boolean {
  if (c.totalDias <= 0) return false
  const total = c.comandasPorDia.reduce((s, q) => s + q, 0)
  if (total <= 0) return false
  return diasComLancamento(c.comandasPorDia) / c.totalDias >= 0.6
}

/**
 * Fração do trabalho do ciclo já feita até o dia `d` (1-based), medida em
 * comandas. É o coração do modelo.
 */
export function fracaoNoPonto(c: CicloHistorico, d: number): number | null {
  const total = c.comandasPorDia.reduce((s, q) => s + q, 0)
  if (total <= 0) return null
  // Ciclos têm tamanhos diferentes (28 a 31 dias). Compara pelo ANDAMENTO,
  // não pelo número do dia: o dia 15 de um ciclo de 30 corresponde ao 15,5 de
  // um de 31. Sem isso, ciclo curto e longo seriam comparados torto.
  const andamento = Math.min(1, Math.max(0, d / c.totalDias))
  const ate = Math.max(1, Math.round(andamento * c.comandasPorDia.length))
  const acum = c.comandasPorDia.slice(0, ate).reduce((s, q) => s + q, 0)
  return acum / total
}

/** Variação entre ciclos consecutivos (0,08 = +8%). */
export function crescimentos(ciclos: CicloHistorico[]): number[] {
  const out: number[] = []
  for (let i = 1; i < ciclos.length; i++) {
    const a = ciclos[i - 1].total
    const b = ciclos[i].total
    if (a > 0) out.push(b / a - 1)
  }
  return out
}

// ── A projeção ──────────────────────────────────────────────────────────────

/** Fração do calendário/dias de trabalho — o estimador que não precisa de nada. */
function fracaoCalendario(e: EntradaProjecao): number {
  if (e.totalDias <= 0) return 1
  return Math.min(1, Math.max(0, e.diasDecorridos / e.totalDias))
}

export function projetar(e: EntradaProjecao): Projecao {
  const motivos: string[] = []
  const t = fracaoCalendario(e)

  const diasSemLancamento = Math.max(
    0,
    Math.min(e.diasDecorridos, e.comandasPorDiaAtual.length) - diasComLancamento(e.comandasPorDiaAtual),
  )

  // Sem acumulado e sem histórico não há o que projetar. Dizer "R$ 0" seria
  // afirmar que ele vai fechar zerado — e é diferente de não saber.
  const elegiveis = semOutliers(e.historico.filter(bemAlimentado))
  if (e.atual <= 0 && elegiveis.length === 0) {
    return {
      esperado: 0, faixa: null, confianca: 'baixa',
      motivos: ['sem histórico ainda'],
      ciclosUsados: 0, diasSemLancamento, temProjecao: false,
    }
  }

  // ── A) RITMO: fração pelo calendário (ou dias de trabalho) ──
  // Matematicamente é o mesmo que "média diária × dias restantes", escrito na
  // forma que todos os estimadores daqui compartilham: acumulado ÷ fração.
  const projA = t > 0 ? e.atual / t : 0

  // ── B) PADRÃO: fração mediana dos ciclos fechados no mesmo ponto ──
  const fracoes = elegiveis
    .map((c) => fracaoNoPonto(c, e.diasDecorridos * (c.totalDias / Math.max(1, e.totalDias))))
    .filter((f): f is number => f !== null && f > 0.01)

  const fracaoTipica = fracoes.length >= 2 ? mediana(fracoes) : null
  const projB = fracaoTipica ? e.atual / fracaoTipica : null

  // ── C) TENDÊNCIA: último ciclo corrigido pelo crescimento mediano ──
  const cres = crescimentos(elegiveis)
  const ultimo = elegiveis.length > 0 ? elegiveis[elegiveis.length - 1].total : 0
  const projC = ultimo > 0
    ? ultimo * (1 + (cres.length >= 2 ? mediana(cres) : 0))
    : null

  // ── Combinação ──
  // C manda no começo e some no fim; A e B dividem o resto, com B levando a
  // maior parte quando existe — ele é o único que sabe a forma real da curva.
  const pesoC = projC !== null ? Math.pow(1 - t, 2) : 0
  const resto = 1 - pesoC
  const pesoB = projB !== null ? resto * 0.7 : 0
  const pesoA = resto - pesoB

  const soma = pesoA + pesoB + pesoC
  const esperado = soma > 0
    ? (projA * pesoA + (projB ?? 0) * pesoB + (projC ?? 0) * pesoC) / soma
    : projA

  // ── Faixa: vem da dispersão das frações históricas ──
  // Fração maior ⇒ "a esta altura eu costumo já ter feito mais" ⇒ fechamento
  // menor. Por isso p75 dá o conservador e p25 o otimista.
  let faixa: { conservador: number; otimista: number } | null = null
  if (fracoes.length >= 3 && e.atual > 0) {
    const alta = percentil(fracoes, 0.75)
    const baixa = percentil(fracoes, 0.25)
    if (alta > 0 && baixa > 0) {
      const conservador = Math.min(e.atual / alta, esperado)
      const otimista = Math.max(e.atual / baixa, esperado)
      faixa = { conservador, otimista }
    }
  }

  // ── Confiança ──
  let confianca: Confianca
  if (elegiveis.length >= 4 && fracoes.length >= 3 && t >= 0.25 && diasSemLancamento <= 2) {
    confianca = 'alta'
  } else if (elegiveis.length >= 2 && t >= 0.15) {
    confianca = 'media'
  } else {
    confianca = 'baixa'
  }

  if (elegiveis.length === 0) motivos.push('sem ciclo fechado com lançamentos pra comparar')
  else if (elegiveis.length < 2) motivos.push('só 1 ciclo de histórico')
  else if (elegiveis.length < 4) motivos.push(`${elegiveis.length} ciclos de histórico`)

  if (t < 0.15) motivos.push('ciclo ainda no começo')
  if (diasSemLancamento === 1) motivos.push('1 dia sem lançamento neste ciclo')
  else if (diasSemLancamento > 1) motivos.push(`${diasSemLancamento} dias sem lançamento neste ciclo`)
  if (motivos.length === 0) motivos.push('histórico consistente e ciclo bem lançado')

  // Um dia sem lançar já derruba a confiança: o acumulado está defasado e a
  // projeção herda a defasagem.
  if (diasSemLancamento > 2 && confianca === 'alta') confianca = 'media'
  if (diasSemLancamento > 4 && confianca === 'media') confianca = 'baixa'

  return {
    esperado,
    faixa,
    confianca,
    motivos,
    ciclosUsados: elegiveis.length,
    diasSemLancamento,
    temProjecao: true,
  }
}

/**
 * Projeção SIMPLES, pra comparação honesta no backtest: média diária × dias
 * do ciclo. É exatamente o que o sistema já mostrava.
 */
export function projecaoSimples(atual: number, diasDecorridos: number, totalDias: number): number {
  if (diasDecorridos <= 0) return 0
  return (atual / diasDecorridos) * totalDias
}
