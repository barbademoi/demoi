/**
 * COMPARATIVO COM O MESMO PERÍODO DO CICLO ANTERIOR — dados do dashboard do dono.
 *
 * Responde a pergunta que o dono faz todo dia: "estou melhor ou pior do que no
 * mês passado a esta altura?". Não "melhor que o mês passado inteiro" — essa
 * comparação só volta a ser justa no último dia do ciclo.
 *
 * A régua de fatiamento é a MESMA de `destaquesMes` e do raio-x da reunião:
 * `lib/mesmoPeriodo.ts`. Aqui não se inventa cálculo novo.
 *
 * ── DUAS QUALIDADES DE CURVA ────────────────────────────────────────────────
 * O R$ do ciclo mora em `lancamentos.comissao_acumulada` (um número por
 * barbeiro por mês), então dia a dia não sai de lá. Existe uma segunda fonte:
 * `lancamentos_diarios.valor`, gravada pela importação do Agenda Serviço — e
 * ela NÃO é o faturamento do dia, é a FOTO do acumulado naquela data (ver
 * `app/api/import-agenda/route.ts`). Ou seja: já vem acumulada, é exatamente a
 * curva que o gráfico quer.
 *
 * Quando essa foto existe e bate com o acumulado oficial, o traçado é MEDIDO —
 * a forma real de como o mês subiu. Quando não existe (barbearia que digita só
 * o acumulado), o traçado vira RITMO MÉDIO: uma reta até o total. As duas
 * respondem "à frente ou atrás", mas só uma conta a história do dia a dia — e
 * a tela diz qual das duas está mostrando, porque uma reta apresentada como
 * medição seria mentira.
 *
 * Em qualquer dos dois casos o último ponto da curva bate com o número da
 * frase: gráfico e texto nunca discordam na mesma tela.
 *
 * Só leitura. Fuso America/Sao_Paulo (quem chama passa `hoje` de hojeBrasil()).
 */
import { cicloDeData, type Ciclo } from './ciclo'
import { diasDecorridosInclusive, fatorMesmoPeriodo } from './mesmoPeriodo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export interface EscopoComparativo {
  /** Acumulado do período decorrido (o mesmo número que a tela já exibe). */
  atual: number
  /** Acumulado do ciclo anterior no MESMO ponto (mesmos dias decorridos). */
  anterior: number
  /** Acumulado dia a dia do ciclo atual, do dia 1 até hoje. */
  serieAtual: number[]
  /** Acumulado dia a dia do ciclo anterior, nos mesmos dias. */
  serieAnterior: number[]
  /** true = curvas vieram de lançamento diário; false = reta de ritmo médio. */
  medido: boolean
}

export interface ComparativoPeriodo {
  diasDecorridos: number
  totalDiasCiclo: number
  labelAtual: string
  labelAnterior: string
  /** false quando o dono navegou pra um ciclo já fechado (compara cheio × cheio). */
  parcial: boolean
  coletivo: EscopoComparativo
  porBarbeiro: Record<string, EscopoComparativo>
}

interface Entrada {
  barbeariaId: string
  /** Ciclo selecionado na tela (pode não ser o corrente). */
  ciclo: Ciclo
  diaFechamento: number
  hoje: Date
  ehPeriodoAtual: boolean
  /** Barbeiros ATIVOS — os mesmos que somam no ranking e no total da casa. */
  barbeiroIds: string[]
  /** Total da casa no ciclo selecionado (mesma precedência do painel). */
  totalAtual: number
  /** Total da casa no ciclo anterior, CHEIO (fatiado aqui dentro). */
  totalAnteriorCheio: number
  atualPorBarbeiro: Record<string, number>
  anteriorCheioPorBarbeiro: Record<string, number>
}

/** Tolerância entre a foto diária e o acumulado oficial pra confiar na curva. */
const TOLERANCIA = 0.02

function retaAte(total: number, dias: number): number[] {
  if (dias <= 0) return []
  return Array.from({ length: dias }, (_, i) => (total * (i + 1)) / dias)
}

/**
 * Reconstrói o acumulado dia a dia a partir das fotos diárias.
 *
 * Preenche pra frente de propósito: a importação pula barbeiro que veio zerado
 * naquele dia, e somar só quem tem linha faria a curva da casa CAIR num dia em
 * que ninguém faturou menos — só houve menos linha. Acumulado não desce.
 */
function reconstruirAcumulado(
  fotos: Map<string, Map<string, number>>,  // barbeiroId → (data ISO → acumulado)
  diasIso: string[],
): { coletivo: number[]; porBarbeiro: Record<string, number[]> } {
  const coletivo: number[] = []
  const porBarbeiro: Record<string, number[]> = {}
  const ultimo = new Map<string, number>()

  // Array.from em vez de iterar o Map direto: o target de compilação do
  // projeto é anterior a es2015 pra iteradores.
  const entradas = Array.from(fotos.entries())
  for (const [b] of entradas) porBarbeiro[b] = []

  for (const iso of diasIso) {
    let soma = 0
    for (const [barbeiroId, porData] of entradas) {
      const v = porData.get(iso)
      if (v != null) ultimo.set(barbeiroId, v)
      const acum = ultimo.get(barbeiroId) ?? 0
      porBarbeiro[barbeiroId].push(acum)
      soma += acum
    }
    coletivo.push(soma)
  }

  return { coletivo, porBarbeiro }
}

/** A curva medida só vale se o fim dela bate com o acumulado oficial. */
function confere(medido: number, oficial: number): boolean {
  if (oficial <= 0 || medido <= 0) return false
  return Math.abs(medido - oficial) / oficial <= TOLERANCIA
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Mesmo rótulo curto do histórico ("jul", ou "05 jul" em ciclo personalizado).
 * Curto de propósito: ele entra no meio de frases ("no mesmo ponto de jul"),
 * e "Julho 2025" ali dentro trava a leitura.
 */
function rotuloCurto(ciclo: Ciclo, diaFechamento: number): string {
  const mes = MESES_CURTOS[ciclo.mesRef - 1]
  return diaFechamento === 1 ? mes : `${String(diaFechamento).padStart(2, '0')} ${mes}`
}

function diasDoCiclo(ciclo: Ciclo): string[] {
  const out: string[] = []
  const cursor = new Date(ciclo.inicio)
  cursor.setHours(12, 0, 0, 0)
  for (let i = 0; i < ciclo.totalDias; i++) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

async function buscarFotos(
  supabase: SupabaseLike,
  barbeariaId: string,
  barbeiroIds: string[],
  ciclo: Ciclo,
): Promise<Map<string, Map<string, number>>> {
  const fotos = new Map<string, Map<string, number>>()
  for (const id of barbeiroIds) fotos.set(id, new Map())
  if (barbeiroIds.length === 0) return fotos

  const { data } = await supabase
    .from('lancamentos_diarios')
    .select('barbeiro_id, data, valor')
    .eq('barbearia_id', barbeariaId)
    .in('barbeiro_id', barbeiroIds)
    .gte('data', ciclo.inicioIso)
    .lte('data', ciclo.fimIso)

  for (const r of (data ?? []) as { barbeiro_id: string; data: string; valor: number | string }[]) {
    const alvo = fotos.get(r.barbeiro_id)
    if (!alvo) continue
    // `data` é DATE; o supabase-js devolve 'YYYY-MM-DD'. Corta qualquer sufixo
    // por segurança, pra a chave sempre casar com diasDoCiclo().
    alvo.set(String(r.data).slice(0, 10), Number(r.valor) || 0)
  }
  return fotos
}

export async function montarComparativoPeriodo(
  supabase: SupabaseLike,
  e: Entrada,
): Promise<ComparativoPeriodo> {
  const { ciclo, diaFechamento } = e

  const antes = new Date(ciclo.inicio)
  antes.setDate(antes.getDate() - 1)
  const cicloAnterior = cicloDeData(antes, diaFechamento)

  // Ciclo fechado: o dono navegou pra trás, então compara mês cheio × mês
  // cheio — ali "mesmo período" é o ciclo inteiro, e fatiar seria errado.
  const diasDecorridos = e.ehPeriodoAtual
    ? Math.min(ciclo.totalDias, Math.max(1, diasDecorridosInclusive(ciclo.inicio, e.hoje)))
    : ciclo.totalDias
  const fator = e.ehPeriodoAtual
    ? fatorMesmoPeriodo(diasDecorridos, cicloAnterior.totalDias)
    : 1

  const diasAtual = diasDoCiclo(ciclo).slice(0, diasDecorridos)
  const diasAnterior = diasDoCiclo(cicloAnterior)
  // Mesmo ponto do ciclo anterior: o dia equivalente, com teto no tamanho dele.
  const pontoAnterior = Math.min(diasDecorridos, cicloAnterior.totalDias)

  const [fotosAtual, fotosAnterior] = await Promise.all([
    buscarFotos(supabase, e.barbeariaId, e.barbeiroIds, ciclo),
    buscarFotos(supabase, e.barbeariaId, e.barbeiroIds, cicloAnterior),
  ])

  const reconAtual = reconstruirAcumulado(fotosAtual, diasAtual)
  const reconAnterior = reconstruirAcumulado(fotosAnterior, diasAnterior)

  function montarEscopo(
    totalAtual: number,
    totalAnteriorCheio: number,
    curvaAtual: number[] | undefined,
    curvaAnterior: number[] | undefined,
  ): EscopoComparativo {
    const anteriorProporcional = totalAnteriorCheio * fator

    // A foto só é aceita quando as DUAS pontas conferem com o oficial: uma
    // curva medida no mês atual contra uma reta no anterior compararia
    // qualidades diferentes e o gráfico mentiria na diferença.
    const fimAtual = curvaAtual?.[curvaAtual.length - 1] ?? 0
    const fimAnterior = curvaAnterior?.[curvaAnterior.length - 1] ?? 0
    const medido =
      confere(fimAtual, totalAtual) && confere(fimAnterior, totalAnteriorCheio)

    if (medido && curvaAtual && curvaAnterior) {
      return {
        atual: totalAtual,
        anterior: curvaAnterior[pontoAnterior - 1] ?? anteriorProporcional,
        serieAtual: curvaAtual,
        serieAnterior: curvaAnterior.slice(0, pontoAnterior),
        medido: true,
      }
    }

    return {
      atual: totalAtual,
      anterior: anteriorProporcional,
      serieAtual: retaAte(totalAtual, diasDecorridos),
      serieAnterior: retaAte(totalAnteriorCheio, cicloAnterior.totalDias).slice(0, pontoAnterior),
      medido: false,
    }
  }

  const porBarbeiro: Record<string, EscopoComparativo> = {}
  for (const id of e.barbeiroIds) {
    porBarbeiro[id] = montarEscopo(
      e.atualPorBarbeiro[id] ?? 0,
      e.anteriorCheioPorBarbeiro[id] ?? 0,
      reconAtual.porBarbeiro[id],
      reconAnterior.porBarbeiro[id],
    )
  }

  return {
    diasDecorridos,
    totalDiasCiclo: ciclo.totalDias,
    labelAtual: rotuloCurto(ciclo, diaFechamento),
    labelAnterior: rotuloCurto(cicloAnterior, diaFechamento),
    parcial: e.ehPeriodoAtual && diasDecorridos < ciclo.totalDias,
    coletivo: montarEscopo(
      e.totalAtual,
      e.totalAnteriorCheio,
      reconAtual.coletivo,
      reconAnterior.coletivo,
    ),
    porBarbeiro,
  }
}
