/**
 * PROJEÇÃO DE FECHAMENTO DO CICLO — estatística local, sem IA e sem rede.
 *
 * ── O QUE O SISTEMA REALMENTE TEM ───────────────────────────────────────────
 * O dono lança COMISSÃO e FATURAMENTO. É esse o dado em que ele confia e é
 * esse que a projeção usa. Uma versão anterior aprendia a curva do ciclo pelas
 * COMANDAS, e isso estava errado por dois motivos: comanda mede volume, não
 * dinheiro (um corte de R$ 30 e um de R$ 120 contam igual), e quem lança
 * religiosamente comissão todo dia, sem lançar comandas, era acusado de
 * "28 dias sem lançamento". Acusação falsa contra quem usa certo.
 *
 * ── OS DOIS ESTIMADORES QUE EXISTEM HOJE ────────────────────────────────────
 *   A (ritmo)     — acumulado de hoje ÷ fração do ciclo já decorrida. Funciona
 *                   do primeiro dia, sem histórico nenhum.
 *   C (tendência) — total do ciclo anterior corrigido pelo crescimento mediano
 *                   entre ciclos fechados. Não depende do acumulado de hoje,
 *                   então é o único que diz algo útil no dia 2.
 *
 * ── E O TERCEIRO, QUE COMEÇA A EXISTIR AGORA ────────────────────────────────
 *   B (padrão)    — fração MEDIANA do ciclo já realizada no mesmo ponto,
 *                   medida nas FOTOS diárias do acumulado (lib/fotoDoDia).
 *                   Essas fotos passaram a ser gravadas há pouco; enquanto não
 *                   houver ciclos fechados com elas, B simplesmente não entra
 *                   e a tela não finge que entrou.
 *
 * O peso de C cai com o andamento do ciclo; A sobe. No fim, a projeção
 * converge para o próprio acumulado, como tem que ser.
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
  /**
   * ACUMULADO em R$ fotografado em cada dia do ciclo; null onde não houve foto.
   *
   * É a ÚNICA fonte da curva. As comandas já serviram aqui e foram removidas:
   * elas medem outra coisa. Uma barbearia que lança comissão e faturamento
   * todo dia, mas não lança comandas, aparecia como "28 dias sem lançamento" —
   * acusação falsa contra quem usa o sistema corretamente. E "N ciclos
   * comparados" dava a entender uma comparação dia a dia que nunca houve.
   *
   * Enquanto não houver fotos (elas começam a existir agora), a projeção se
   * apoia no ritmo do próprio ciclo e na tendência entre ciclos — ambos vindos
   * do R$, que é o que o dono realmente lança.
   */
  acumuladoPorDia?: (number | null)[]
  /** Dias que o ciclo teve (28–31, conforme dia_fechamento). */
  totalDias: number
}

/**
 * CURVA ACUMULADA do ciclo, normalizada em fração de 0 a 1, a partir das
 * fotos diárias. null = este ciclo não tem foto nenhuma, e portanto não tem
 * forma conhecida.
 */
export function curvaDoCiclo(c: CicloHistorico): number[] | null {
  const fotos = c.acumuladoPorDia ?? []
  if (!fotos.some((v) => v != null && v > 0)) return null

  // Dia sem foto herda o acumulado anterior: acumulado não desce.
  const curva: number[] = []
  let ultimo = 0
  for (let i = 0; i < fotos.length; i++) {
    const v = fotos[i]
    if (v != null && v > ultimo) ultimo = v
    curva.push(ultimo)
  }
  const fim = curva[curva.length - 1] ?? 0
  return fim > 0 ? curva.map((v) => v / fim) : null
}

export interface EntradaProjecao {
  /** Acumulado de hoje no ciclo corrente (R$). */
  atual: number
  /** Dias decorridos do ciclo corrente, contando hoje (1 = primeiro dia). */
  diasDecorridos: number
  /** Dias que o ciclo corrente terá no total. */
  totalDias: number
  /** Fotos do acumulado no ciclo CORRENTE, até hoje. null = sem foto no dia. */
  acumuladoPorDiaAtual?: (number | null)[]
  /** Ciclos FECHADOS anteriores, do mais antigo ao mais recente. */
  historico: CicloHistorico[]
  /** Dias de trabalho do barbeiro no mês (null = usa o calendário). */
  diasTrabalhoMes: number | null
}

/**
 * COMO a projeção foi feita. Substituiu o rótulo de "confiança".
 *
 * "Confiança baixa" descrevia o estado NORMAL da maioria das barbearias — as
 * que não lançam comandas — e soava como um defeito do cliente. Virava
 * discussão em vez de informação. Isto aqui descreve o MÉTODO, que é um fato
 * sobre a conta, não um julgamento sobre quem usa.
 */
export type Metodo =
  /** Comparou o andamento DIA A DIA com os ciclos anteriores (precisa de fotos). */
  | 'historico'
  /** Ritmo do mês + tendência entre os ciclos fechados. */
  | 'tendencia'
  /** Só o ritmo do próprio mês. É o piso, e funciona sozinho desde o dia 1. */
  | 'ritmo'

export interface Projecao {
  /** Valor esperado de fechamento (R$). */
  esperado: number
  metodo: Metodo
  /** Frase curta do método ("6 ciclos comparados"). */
  descricaoMetodo: string
  /**
   * Aviso acionável, e SÓ quando há lacuna no hábito da própria barbearia:
   * quem lança todo dia e ficou dias sem lançar. Quem nunca lançou não recebe
   * aviso nenhum — não é falha dela, é o padrão dela.
   */
  alerta: string | null
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

/**
 * Ciclo BEM ALIMENTADO: tem foto do acumulado na maior parte dos dias. A régua
 * é 60% — folga de 1 dia por semana cabe dentro disso, mas um ciclo
 * fotografado só na primeira semana não passa.
 */
export function bemAlimentado(c: CicloHistorico): boolean {
  if (c.totalDias <= 0) return false
  if (!curvaDoCiclo(c)) return false
  const fotos = c.acumuladoPorDia ?? []
  const dias = fotos.filter((v) => v != null && (v as number) > 0).length
  return dias / c.totalDias >= 0.6
}

/** Fração do ciclo já realizada até o dia `d` (1-based), medida em R$. */
export function fracaoNoPonto(c: CicloHistorico, d: number): number | null {
  const curva = curvaDoCiclo(c)
  if (!curva || curva.length === 0) return null
  // Ciclos têm tamanhos diferentes (28 a 31 dias). Compara pelo ANDAMENTO,
  // não pelo número do dia: o dia 15 de um ciclo de 30 corresponde ao 15,5 de
  // um de 31. Sem isso, ciclo curto e longo seriam comparados torto.
  const andamento = Math.min(1, Math.max(0, d / c.totalDias))
  const ate = Math.max(1, Math.min(curva.length, Math.round(andamento * curva.length)))
  return curva[ate - 1]
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

  // Dias sem registro, contados nas FOTOS — e só quando há alguma foto neste
  // ciclo. Sem foto nenhuma, a resposta honesta é "não sei", não "28 dias sem
  // lançamento": o sistema ainda não guardava essa informação.
  const fotosAtual = e.acumuladoPorDiaAtual ?? []
  const temAlgumaFoto = fotosAtual.some((v) => v != null && v > 0)
  const diasSemLancamento = temAlgumaFoto
    ? Math.max(0, Math.min(e.diasDecorridos, fotosAtual.length) - fotosAtual.filter((v) => v != null && v > 0).length)
    : 0

  // Sem acumulado e sem histórico não há o que projetar. Dizer "R$ 0" seria
  // afirmar que ele vai fechar zerado — e é diferente de não saber.
  // DUAS elegibilidades, porque os estimadores pedem coisas diferentes.
  // Exigir curva diária pros dois era um erro: a TENDÊNCIA precisa só do
  // total de cada ciclo — que todo mundo tem — e estava sendo barrada junto
  // com o padrão diário, que ninguém ainda tem. O efeito era o modelo
  // empatar com a regra de três em vez de usar o histórico disponível.
  const elegiveisTotal = semOutliers(e.historico.filter((c) => c.total > 0))
  const elegiveis = semOutliers(e.historico.filter(bemAlimentado))
  if (e.atual <= 0 && elegiveisTotal.length === 0) {
    return {
      esperado: 0, faixa: null, confianca: 'baixa',
      metodo: 'ritmo', descricaoMetodo: 'sem histórico ainda', alerta: null,
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
  const cres = crescimentos(elegiveisTotal)
  const ultimo = elegiveisTotal.length > 0 ? elegiveisTotal[elegiveisTotal.length - 1].total : 0
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

  // ── Método e aviso ──
  // O método é um fato sobre a conta. O aviso só existe quando há lacuna no
  // hábito DESTA barbearia — nunca por ela simplesmente não lançar comandas.
  // O rótulo tem que ser literalmente verdadeiro. "N ciclos comparados" só
  // vale quando houve comparação DIA A DIA; com fotos ainda inexistentes, o
  // que há é tendência entre totais — e é isso que a tela vai dizer.
  const ciclosComTotal = elegiveisTotal.length
  const metodo: Metodo = fracaoTipica !== null
    ? 'historico'
    : projC !== null && ciclosComTotal >= 2 ? 'tendencia' : 'ritmo'

  const plural = (n: number) => `${n} ${n === 1 ? 'ciclo' : 'ciclos'}`
  const descricaoMetodo =
    metodo === 'historico' ? `andamento comparado com ${plural(elegiveis.length)}`
      : metodo === 'tendencia' ? `ritmo do mês + tendência de ${plural(ciclosComTotal)}`
        : t < 0.15 ? 'ritmo do mês — ciclo ainda no começo'
          : 'ritmo do mês'

  // Alerta só quando há foto neste ciclo E uma lacuna nela. Sem foto, o
  // sistema não sabe se houve movimento — e calar é melhor que acusar.
  const alerta = temAlgumaFoto && diasSemLancamento > 2
    ? `${diasSemLancamento} dias sem registro neste ciclo`
    : null

  // `confianca` continua existindo porque a faixa e a ordenação dependem dela,
  // mas deixou de virar rótulo na tela.
  let confianca: Confianca
  if (elegiveis.length >= 4 && fracoes.length >= 3 && t >= 0.25 && diasSemLancamento <= 2) {
    confianca = 'alta'
  } else if (elegiveis.length >= 2 && t >= 0.15) {
    confianca = 'media'
  } else {
    confianca = 'baixa'
  }
  if (diasSemLancamento > 2 && confianca === 'alta') confianca = 'media'
  if (diasSemLancamento > 4 && confianca === 'media') confianca = 'baixa'

  motivos.push(descricaoMetodo)
  if (alerta) motivos.push(alerta)

  return {
    esperado,
    faixa,
    confianca,
    metodo,
    descricaoMetodo,
    alerta,
    motivos,
    ciclosUsados: Math.max(elegiveis.length, elegiveisTotal.length),
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
