/**
 * PROJEÇÃO DE FECHAMENTO DO CICLO — estatística local, sem IA e sem rede.
 *
 * ── O QUE QUEBROU, E POR QUÊ ────────────────────────────────────────────────
 * No último dia do ciclo a projeção aparecia IGUAL ao acumulado. Duas causas
 * independentes, que se multiplicavam:
 *
 *   1. HOJE CONTAVA COMO DECORRIDO. No dia 31 de um ciclo de 31 dias o
 *      andamento dava 100%, e "acumulado ÷ 100%" é o próprio acumulado —
 *      mesmo com a barbearia aberta e o dia inteiro pela frente.
 *   2. A POSIÇÃO ERA MEDIDA PELO NÚMERO DO DIA. Dia 31 contra um mês de 30
 *      dias também virava 100%, e o "mesmo ponto" do ciclo anterior passava a
 *      ser o mês inteiro.
 *
 * As duas estão corrigidas aqui, e a forma da conta mudou por causa disso.
 *
 * ── A CONTA, AGORA ──────────────────────────────────────────────────────────
 *   projeção = acumulado + o que ainda se espera nos dias que FALTAM
 *
 * HOJE é um dia que falta, não um dia que passou — ele só vira passado depois
 * da virada (America/Sao_Paulo). Como parte do dia pode já estar registrada, o
 * que hoje acrescenta é `max(0, esperado do dia − já registrado hoje)`.
 *
 * Escrita assim, a projeção só pode ser igual ao acumulado quando não resta
 * nenhum dia de trabalho — e nesse caso a tela para de chamar isso de
 * projeção.
 *
 * ── A POSIÇÃO NO CICLO É MEDIDA EM DIAS DE TRABALHO ─────────────────────────
 * Nunca pelo número do dia do mês. Uma barbearia que fecha domingo tem 26 dias
 * de trabalho num mês de 31: no dia 28 ela está a 92% do calendário mas a 88%
 * do trabalho, e são 3 dias de faturamento de diferença. O mesmo vale pra
 * comparar com ciclos anteriores de tamanhos diferentes.
 *
 * ── OS TRÊS ESTIMADORES ─────────────────────────────────────────────────────
 *   A (ritmo)     — acumulado + esperado nos dias restantes, com cada dia
 *                   pesado pelo DIA DA SEMANA que ele é (sábado rende mais que
 *                   segunda). Os pesos saem do histórico desta barbearia, e o
 *                   valor de um "dia padrão" é metade a média do mês, metade o
 *                   ritmo das últimas duas semanas — num mês que começa forte
 *                   e cai, a média do mês inteiro superestima o que falta.
 *   B (padrão)    — fração MEDIANA do ciclo já realizada no mesmo ponto, nas
 *                   fotos diárias dos ciclos anteriores.
 *   C (tendência) — ciclo anterior corrigido pelo crescimento mediano. É o
 *                   único que diz algo no dia 2.
 *
 * O peso de A CRESCE com o andamento e o de C cai: no fim do ciclo quem manda
 * é o que esta barbearia está fazendo agora, não o que ela costumava fazer.
 *
 * ── O QUE ESTA FUNÇÃO NÃO FAZ ───────────────────────────────────────────────
 * Não chama IA, não acessa rede, não lê banco. Recebe números, devolve números.
 * E o resultado é SÓ INFORMATIVO: não alimenta premiação, folha, ranking nem
 * meta — nada aqui é escrito em lugar nenhum.
 */

export type Confianca = 'alta' | 'media' | 'baixa'

/** Janela do ritmo recente, em dias de trabalho — passa por toda a semana. */
const JANELA_RECENTE = 8
/** Abaixo disso o ritmo recente é ruído, e a conta fica com a média do mês. */
const MIN_AMOSTRAS_RECENTES = 6
/**
 * Quanto o ritmo recente manda no esperado dos dias que faltam. Meio a meio
 * com a média do mês: não há motivo pra afirmar que um dos dois sabe mais.
 */
const PESO_RECENTE = 0.5

/** Um dia do ciclo, como o modelo precisa enxergar. */
export interface DiaDoCiclo {
  /** A barbearia abre neste dia (calendário de operação). */
  aberto: boolean
  /** Dia da semana: 0 = domingo … 6 = sábado. */
  dow: number
  /** Acumulado em R$ fotografado neste dia; null = sem foto. */
  acumulado: number | null
}

export interface CicloHistorico {
  mes: number
  ano: number
  /** Total do ciclo no campo-base da barbearia (R$). */
  total: number
  dias: DiaDoCiclo[]
}

export interface EntradaProjecao {
  /** Acumulado de hoje no ciclo corrente (R$), incluindo o que entrou hoje. */
  atual: number
  /** Todos os dias do ciclo corrente, do primeiro ao último. */
  dias: DiaDoCiclo[]
  /** Índice de HOJE em `dias`. -1 quando hoje está fora do ciclo. */
  indiceHoje: number
  /** Ciclos anteriores, do mais antigo ao mais recente. */
  historico: CicloHistorico[]
}

export type Metodo =
  /** Comparou o andamento com os ciclos anteriores (precisa de fotos). */
  | 'historico'
  /** Ritmo do mês + tendência entre os ciclos fechados. */
  | 'tendencia'
  /** Só o ritmo do próprio mês. Funciona sozinho desde o dia 1. */
  | 'ritmo'

export interface Projecao {
  /** Valor esperado de fechamento (R$). */
  esperado: number
  metodo: Metodo
  descricaoMetodo: string
  alerta: string | null
  faixa: { conservador: number; otimista: number } | null
  confianca: Confianca
  motivos: string[]
  ciclosUsados: number
  diasSemLancamento: number
  /** Dias de trabalho que ainda faltam, HOJE incluído se hoje abre. */
  diasRestantes: number
  /** true = não resta dia de trabalho; não é mais projeção, é o fechamento. */
  cicloFechado: boolean
  temProjecao: boolean
}

// ── Estatística miúda ───────────────────────────────────────────────────────

export function mediana(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

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

/** Ciclo atípico sai do padrão (Tukey, 1,5 × IQR sobre os totais). */
export function semOutliers(ciclos: CicloHistorico[]): CicloHistorico[] {
  if (ciclos.length < 4) return ciclos
  const totais = ciclos.map((c) => c.total)
  const q1 = percentil(totais, 0.25)
  const q3 = percentil(totais, 0.75)
  const iqr = q3 - q1
  if (iqr <= 0) return ciclos
  const filtrados = ciclos.filter((c) => c.total >= q1 - 1.5 * iqr && c.total <= q3 + 1.5 * iqr)
  return filtrados.length >= 2 ? filtrados : ciclos
}

// ── Leitura da curva ────────────────────────────────────────────────────────

/** Acumulado dia a dia, preenchido pra frente. Acumulado não desce. */
function curvaAbsoluta(dias: DiaDoCiclo[]): number[] {
  const out: number[] = []
  let ultimo = 0
  for (const d of dias) {
    if (d.acumulado != null && d.acumulado > ultimo) ultimo = d.acumulado
    out.push(ultimo)
  }
  return out
}

/** Curva normalizada em fração 0..1. null = ciclo sem foto nenhuma. */
export function curvaDoCiclo(c: CicloHistorico): number[] | null {
  if (!c.dias.some((d) => d.acumulado != null && d.acumulado > 0)) return null
  const curva = curvaAbsoluta(c.dias)
  const fim = curva[curva.length - 1] ?? 0
  return fim > 0 ? curva.map((v) => v / fim) : null
}

export const diasDeTrabalho = (dias: DiaDoCiclo[]): number => dias.filter((d) => d.aberto).length

/**
 * Ciclo BEM ALIMENTADO: tem foto na maior parte dos DIAS DE TRABALHO. A régua
 * é sobre os dias abertos, não sobre o calendário — senão quem fecha domingo
 * nunca passaria.
 */
export function bemAlimentado(c: CicloHistorico): boolean {
  const trabalho = diasDeTrabalho(c.dias)
  if (trabalho <= 0) return false
  if (!curvaDoCiclo(c)) return false
  const comFoto = c.dias.filter((d) => d.aberto && d.acumulado != null && d.acumulado > 0).length
  return comFoto / trabalho >= 0.6
}

/**
 * Fração do ciclo já realizada quando `progresso` (0..1) dos DIAS DE TRABALHO
 * dele já tinham passado. Medir por dias de trabalho é o que torna
 * comparáveis ciclos de tamanhos e folgas diferentes.
 */
export function fracaoNoProgresso(c: CicloHistorico, progresso: number): number | null {
  const curva = curvaDoCiclo(c)
  if (!curva) return null
  const trabalho = diasDeTrabalho(c.dias)
  if (trabalho <= 0) return null

  const alvo = Math.min(1, Math.max(0, progresso)) * trabalho
  let contados = 0
  for (let i = 0; i < c.dias.length; i++) {
    if (c.dias[i].aberto) contados++
    if (contados >= alvo) return curva[i]
  }
  return curva[curva.length - 1]
}

export function crescimentos(ciclos: CicloHistorico[]): number[] {
  const out: number[] = []
  for (let i = 1; i < ciclos.length; i++) {
    const a = ciclos[i - 1].total
    if (a > 0) out.push(ciclos[i].total / a - 1)
  }
  return out
}

/**
 * PESO DE CADA DIA DA SEMANA, aprendido das fotos desta barbearia.
 *
 * Sábado rende mais que segunda, e no fim do ciclo isso decide. Sem histórico
 * de fotos, todos os dias pesam 1 — a conta vira a média simples, que é o
 * comportamento honesto quando não se sabe.
 *
 * Cada ciclo é normalizado pela própria média antes de entrar, senão um mês
 * mais forte dominaria os pesos de todos os dias.
 */
/** Média sem o maior e o menor — um dia atípico não decide o ritmo. */
export function mediaTrimada(xs: number[]): number {
  if (xs.length === 0) return 0
  if (xs.length < 4) return xs.reduce((s, x) => s + x, 0) / xs.length
  const s = [...xs].sort((a, b) => a - b).slice(1, -1)
  return s.reduce((a, x) => a + x, 0) / s.length
}

/**
 * QUANTO CADA DIA JÁ TRABALHADO RENDEU, em "dias padrão" — ou seja, com o peso
 * do dia da semana descontado, pra que uma segunda e um sábado possam ser
 * comparados.
 *
 * Só entram pares CONSECUTIVOS de fotos. Um dia aberto sem foto no meio
 * inventaria um dia gigante (o acumulado de dois dias aparecendo como um), e
 * isso estragaria o ritmo recente. Então o buraco corta a série em vez de
 * sujá-la.
 */
export function unidadesPorDiaPadrao(
  dias: DiaDoCiclo[],
  ate: number,
  pesoDe: (d: DiaDoCiclo) => number,
): number[] {
  const curva = curvaAbsoluta(dias)
  const out: number[] = []
  let base = 0
  let cadeia = true
  for (let i = 0; i < Math.min(ate, dias.length); i++) {
    const d = dias[i]
    if (!d.aberto) continue
    if (!(d.acumulado != null && d.acumulado > 0)) { cadeia = false; continue }
    if (!cadeia) { base = curva[i]; cadeia = true; continue }
    const delta = curva[i] - base
    base = curva[i]
    if (delta >= 0) out.push(delta / pesoDe(d))
  }
  return out
}

export function pesosPorDiaDaSemana(ciclos: CicloHistorico[]): number[] {
  const amostras: number[][] = [[], [], [], [], [], [], []]

  for (const c of ciclos) {
    const curva = curvaAbsoluta(c.dias)
    const deltas: { dow: number; v: number }[] = []
    for (let i = 0; i < c.dias.length; i++) {
      if (!c.dias[i].aberto) continue
      const v = curva[i] - (i > 0 ? curva[i - 1] : 0)
      if (v >= 0) deltas.push({ dow: c.dias[i].dow, v })
    }
    if (deltas.length === 0) continue
    const media = deltas.reduce((s, d) => s + d.v, 0) / deltas.length
    if (media <= 0) continue
    for (const d of deltas) amostras[d.dow].push(d.v / media)
  }

  return amostras.map((xs) => (xs.length >= 2 ? mediana(xs) : 1))
}

// ── A projeção ──────────────────────────────────────────────────────────────

export function projetar(e: EntradaProjecao): Projecao {
  const motivos: string[] = []
  const dias = e.dias
  const iHoje = e.indiceHoje

  // HOJE AINDA NÃO PASSOU. Decorrido é o que ficou ESTRITAMENTE para trás; o
  // próprio dia de hoje entra nos restantes, porque a barbearia ainda vai
  // trabalhar nele. Era exatamente isto que fazia a projeção do último dia
  // dar o próprio acumulado.
  const antesDeHoje = iHoje >= 0 ? dias.slice(0, iHoje) : dias
  const deHojeEmDiante = iHoje >= 0 ? dias.slice(iHoje) : []

  const trabalhoTotal = diasDeTrabalho(dias)
  const decorridos = diasDeTrabalho(antesDeHoje)
  const restantes = diasDeTrabalho(deHojeEmDiante)
  const t = trabalhoTotal > 0 ? Math.min(1, decorridos / trabalhoTotal) : 1

  // Quanto já entrou HOJE: a diferença entre a foto de hoje e a última
  // anterior. Sem foto, assume 0 — e o dia entra inteiro na projeção.
  const curvaAtual = curvaAbsoluta(dias)
  const registradoHoje = iHoje >= 0
    ? Math.max(0, (curvaAtual[iHoje] ?? 0) - (iHoje > 0 ? curvaAtual[iHoje - 1] : 0))
    : 0

  // Dias abertos, até hoje, sem nenhuma foto.
  const ateHoje = iHoje >= 0 ? dias.slice(0, iHoje + 1) : dias
  const temAlgumaFoto = ateHoje.some((d) => d.acumulado != null && d.acumulado > 0)
  const diasSemLancamento = temAlgumaFoto
    ? ateHoje.filter((d) => d.aberto && !(d.acumulado != null && d.acumulado > 0)).length
    : 0

  const elegiveisTotal = semOutliers(e.historico.filter((c) => c.total > 0))
  const elegiveis = semOutliers(e.historico.filter(bemAlimentado))

  const vazio = (motivo: string): Projecao => ({
    esperado: e.atual, metodo: 'ritmo', descricaoMetodo: motivo, alerta: null,
    faixa: null, confianca: 'baixa', motivos: [motivo],
    ciclosUsados: 0, diasSemLancamento, diasRestantes: restantes,
    cicloFechado: restantes === 0, temProjecao: false,
  })

  if (e.atual <= 0 && elegiveisTotal.length === 0) return vazio('sem histórico ainda')

  // ── Ciclo sem dia de trabalho restante ──
  // Não há o que projetar: o número final é o próprio acumulado. A tela troca
  // o rótulo, porque chamar isso de "projeção" seria enganoso.
  if (restantes === 0) {
    return {
      esperado: e.atual, metodo: 'ritmo', descricaoMetodo: 'ciclo encerrado',
      alerta: null, faixa: null, confianca: 'alta',
      motivos: ['ciclo encerrado'], ciclosUsados: elegiveisTotal.length,
      diasSemLancamento, diasRestantes: 0, cicloFechado: true, temProjecao: true,
    }
  }

  // ── A) RITMO: acumulado + o que falta, dia a dia ──
  const pesos = pesosPorDiaDaSemana(elegiveis)
  const pesoDe = (d: DiaDoCiclo) => (pesos[d.dow] ?? 1) || 1
  const acumAteOntem = Math.max(0, e.atual - registradoHoje)

  // UNIDADE = quanto rende um "dia padrão" desta barbearia.
  //
  // O acumulado é dividido pela SOMA DOS PESOS dos dias já trabalhados, e não
  // pela contagem deles. Dividir pela contagem e depois multiplicar pelo peso
  // do dia da semana contaria o peso duas vezes, e o erro apareceria inteiro
  // justamente nos dias de mais movimento — os que mais pesam no fechamento.
  const somaPesosDecorridos = antesDeHoje.reduce((s, d) => s + (d.aberto ? pesoDe(d) : 0), 0)
  const unidadeMes = somaPesosDecorridos > 0 ? acumAteOntem / somaPesosDecorridos : 0

  // RITMO RECENTE. Num mês com estação — "do dia 1 ao 15 é mais forte, depois
  // cai", que é o padrão que muita barbearia tem — a média do mês INTEIRO
  // superestima os dias que ainda faltam, e no fim do ciclo isso vira dinheiro
  // na projeção. Havendo fotos diárias suficientes, as últimas duas semanas
  // corrigem a conta. Sem fotos, nada disso acontece e a conta é a do mês.
  const unidades = unidadesPorDiaPadrao(dias, Math.max(0, iHoje), pesoDe)
  const recentes = unidades.slice(-JANELA_RECENTE)
  const unidadeRecente = recentes.length >= MIN_AMOSTRAS_RECENTES ? mediaTrimada(recentes) : null
  const unidade = unidadeRecente !== null && unidadeRecente > 0
    ? unidadeMes * (1 - PESO_RECENTE) + unidadeRecente * PESO_RECENTE
    : unidadeMes

  let esperadoRestante = 0
  for (let k = 0; k < deHojeEmDiante.length; k++) {
    const d = deHojeEmDiante[k]
    if (!d.aberto) continue
    const esperadoDoDia = unidade * pesoDe(d)
    // Hoje já pode ter rendido parte do que renderia: só o que falta entra.
    esperadoRestante += k === 0 ? Math.max(0, esperadoDoDia - registradoHoje) : esperadoDoDia
  }
  const projA = e.atual + esperadoRestante

  // ── B) PADRÃO: fração mediana no mesmo ponto, em dias de trabalho ──
  const fracoes = elegiveis
    .map((c) => fracaoNoProgresso(c, t))
    .filter((f): f is number => f !== null && f > 0.01)
  const fracaoTipica = fracoes.length >= 2 ? mediana(fracoes) : null
  const projB = fracaoTipica && fracaoTipica > 0 ? acumAteOntem / fracaoTipica : null

  // ── C) TENDÊNCIA ──
  const cres = crescimentos(elegiveisTotal)
  const ultimo = elegiveisTotal.length > 0 ? elegiveisTotal[elegiveisTotal.length - 1].total : 0
  const projC = ultimo > 0 ? ultimo * (1 + (cres.length >= 2 ? mediana(cres) : 0)) : null

  // ── Combinação ──
  // O peso de A CRESCE com o andamento: no fim do ciclo o que esta barbearia
  // está fazendo agora vale mais que o que ela costumava fazer. Antes era o
  // contrário, e o rótulo "pelo histórico" aparecia justamente no último dia.
  const pesoC = projC !== null ? Math.pow(1 - t, 2) : 0
  const resto = 1 - pesoC
  const pesoA = projB !== null ? resto * (0.30 + 0.70 * t) : resto
  const pesoB = Math.max(0, resto - pesoA)

  const soma = pesoA + pesoB + pesoC
  const esperado = soma > 0
    ? (projA * pesoA + (projB ?? 0) * pesoB + (projC ?? 0) * pesoC) / soma
    : projA

  // ── Faixa ──
  let faixa: { conservador: number; otimista: number } | null = null
  if (fracoes.length >= 3 && acumAteOntem > 0) {
    const alta = percentil(fracoes, 0.75)
    const baixa = percentil(fracoes, 0.25)
    if (alta > 0 && baixa > 0) {
      faixa = {
        conservador: Math.min(acumAteOntem / alta, esperado),
        otimista: Math.max(acumAteOntem / baixa, esperado),
      }
    }
  }
  // A projeção nunca pode ficar abaixo do que JÁ ENTROU.
  const piso = Math.max(e.atual, esperado)
  if (faixa) faixa = { conservador: Math.max(e.atual, faixa.conservador), otimista: Math.max(piso, faixa.otimista) }

  // ── Método e aviso ──
  const metodo: Metodo = fracaoTipica !== null
    ? 'historico'
    : projC !== null && elegiveisTotal.length >= 2 ? 'tendencia' : 'ritmo'

  const plural = (n: number) => `${n} ${n === 1 ? 'ciclo' : 'ciclos'}`
  const descricaoMetodo =
    metodo === 'historico' ? `andamento comparado com ${plural(elegiveis.length)}`
      : metodo === 'tendencia' ? `ritmo do mês + tendência de ${plural(elegiveisTotal.length)}`
        : t < 0.15 ? 'ritmo do mês — ciclo ainda no começo'
          : 'ritmo do mês'

  const alerta = temAlgumaFoto && diasSemLancamento > 2
    ? `${diasSemLancamento} dias sem registro neste ciclo`
    : null

  let confianca: Confianca
  if (elegiveis.length >= 4 && fracoes.length >= 3 && t >= 0.25 && diasSemLancamento <= 2) confianca = 'alta'
  else if (elegiveisTotal.length >= 2 && t >= 0.15) confianca = 'media'
  else confianca = 'baixa'
  if (diasSemLancamento > 2 && confianca === 'alta') confianca = 'media'
  if (diasSemLancamento > 4 && confianca === 'media') confianca = 'baixa'

  motivos.push(descricaoMetodo)
  if (alerta) motivos.push(alerta)

  return {
    esperado: piso,
    metodo, descricaoMetodo, alerta, faixa, confianca, motivos,
    ciclosUsados: Math.max(elegiveis.length, elegiveisTotal.length),
    diasSemLancamento, diasRestantes: restantes,
    cicloFechado: false, temProjecao: true,
  }
}

/** Projeção SIMPLES, pra comparação no backtest: média por dia de trabalho. */
export function projecaoSimples(atual: number, decorridos: number, total: number): number {
  if (decorridos <= 0) return 0
  return (atual / decorridos) * total
}
