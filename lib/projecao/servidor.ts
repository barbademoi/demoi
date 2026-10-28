/**
 * PROJEÇÃO — carregamento no servidor.
 *
 * Monta as entradas de `lib/projecao` a partir do banco, com DUAS consultas
 * para toda a barbearia (não uma por barbeiro):
 *   - `lancamentos`: o total em R$ de cada barbeiro em cada ciclo;
 *   - `lancamentos_diarios`: as comandas dia a dia, que dão a FORMA da curva.
 *
 * ── POR QUE CICLO PASSADO E NÃO "MÊS FECHADO" ───────────────────────────────
 * `meses_fechados` é uma TRAVA que o dono escolhe apertar — muita barbearia
 * nunca fecha mês nenhum. Exigir isso deixaria o modelo sem histórico
 * justamente para quem mais precisa. O que interessa aqui é outra coisa, e é
 * factual: o ciclo já terminou. Um ciclo cujo último dia ficou no passado está
 * completo, tendo o dono apertado a trava ou não.
 *
 * Só leitura. Fuso America/Sao_Paulo (o ciclo vem de `lib/ciclo`).
 */
import { cicloDeData, type Ciclo } from '@/lib/ciclo'
import { projetar, type CicloHistorico, type Projecao } from '@/lib/projecao'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

/** Quantos ciclos passados entram no padrão. 6 cobre meio ano. */
const CICLOS_HISTORICO = 6

export interface ProjecaoBarbeiro extends Projecao {
  barbeiroId: string
}

export interface ProjecaoDoCiclo {
  /** Projeção de cada barbeiro ativo, pelo id. */
  porBarbeiro: Record<string, ProjecaoBarbeiro>
  /**
   * Projeção da casa, em FATURAMENTO.
   *
   * Não é a soma dos cards, e isso é deliberado. Os cards mostram o campo-base
   * que o dono escolheu (faturamento, comissão ou os dois); o bloco geral
   * mostra o FATURAMENTO da barbearia. Quando a base é comissão, somar os
   * cards daria a projeção da comissão da equipe — outra grandeza, e não a
   * que o dono quer ver no geral. Com base em faturamento, os dois coincidem.
   *
   * A fonte é a mesma do painel: `metas.faturamento_acumulado` quando existe,
   * senão a soma dos acumulados dos barbeiros.
   */
  casa: Projecao & {
    /** Total de faturamento do ciclo anterior. 0 = não há anterior. */
    totalCicloAnterior: number
    /** true = a base dos cards é comissão, então geral ≠ soma dos cards. */
    baseDiferenteDosCards: boolean
  }
}

function diasDoCiclo(c: Ciclo): string[] {
  const out: string[] = []
  const cursor = new Date(c.inicio)
  cursor.setHours(12, 0, 0, 0)
  for (let i = 0; i < c.totalDias; i++) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** Os N ciclos anteriores ao atual, do mais antigo pro mais recente. */
function ciclosAnteriores(atual: Ciclo, diaFechamento: number, quantos: number): Ciclo[] {
  const out: Ciclo[] = []
  let cursor = new Date(atual.inicio)
  for (let i = 0; i < quantos; i++) {
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
    cursor.setHours(12, 0, 0, 0)
    out.unshift(cicloDeData(cursor, diaFechamento))
    cursor = new Date(out[0].inicio)
  }
  return out
}

export async function carregarProjecao(
  supabase: Supa,
  opts: {
    barbeariaId: string
    /** Ciclo mostrado na tela. */
    ciclo: Ciclo
    diaFechamento: number
    /** Hoje (America/Sao_Paulo). */
    hoje: Date
    /** true = o ciclo da tela é o corrente; projeção só faz sentido nele. */
    ehPeriodoAtual: boolean
    /** Barbeiros ativos com o acumulado do ciclo e os dias de trabalho. */
    barbeiros: { id: string; comissao: number; dias_trabalho_mes?: number | null }[]
    diasTrabalhoPadrao: number | null
    /** Base dos cards. Comissão ⇒ o bloco geral mostra outra grandeza. */
    baseEhComissao: boolean
  },
): Promise<ProjecaoDoCiclo | null> {
  const { barbeariaId, ciclo, diaFechamento, hoje, ehPeriodoAtual, barbeiros } = opts

  // Ciclo passado não se projeta: ele já fechou, o número real está na tela.
  if (!ehPeriodoAtual || barbeiros.length === 0) return null

  const anteriores = ciclosAnteriores(ciclo, diaFechamento, CICLOS_HISTORICO)
  const todos = [...anteriores, ciclo]
  const ids = barbeiros.map((b) => b.id)

  // ── Totais em R$ de cada ciclo ──
  const { data: lancRaw } = await supabase
    .from('lancamentos')
    .select('barbeiro_id, mes, ano, comissao_acumulada')
    .eq('barbearia_id', barbeariaId)
    .in('barbeiro_id', ids)
    .in('ano', Array.from(new Set(todos.map((c) => c.anoRef))))

  const totalPor = new Map<string, number>() // `${barbeiroId}|${mes}-${ano}` → R$
  for (const r of (lancRaw ?? []) as { barbeiro_id: string; mes: number; ano: number; comissao_acumulada: number }[]) {
    totalPor.set(`${r.barbeiro_id}|${r.mes}-${r.ano}`, Number(r.comissao_acumulada) || 0)
  }

  // ── Comandas dia a dia de todo o período ──
  const { data: diariosRaw } = await supabase
    .from('lancamentos_diarios')
    .select('barbeiro_id, data, valor')
    .eq('barbearia_id', barbeariaId)
    .in('barbeiro_id', ids)
    .gte('data', anteriores[0].inicioIso)
    .lte('data', ciclo.fimIso)

  const fotoPor = new Map<string, number>()           // `${barbeiroId}|${dataIso}` → R$ acumulado
  type LinhaDiaria = { barbeiro_id: string; data: string; valor: number | string | null }
  for (const r of (diariosRaw ?? []) as LinhaDiaria[]) {
    const chave = `${r.barbeiro_id}|${String(r.data).slice(0, 10)}`
    const v = Number(r.valor) || 0
    if (v > 0) fotoPor.set(chave, v)
  }

  const diasPorCiclo = new Map<Ciclo, string[]>()
  for (const c of todos) diasPorCiclo.set(c, diasDoCiclo(c))

  // Dias do ciclo atual já decorridos, contando hoje.
  const diasAtual = diasPorCiclo.get(ciclo)!
  const hojeIso = (() => {
    const y = hoje.getFullYear()
    const m = String(hoje.getMonth() + 1).padStart(2, '0')
    const d = String(hoje.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })()
  const idxHoje = diasAtual.indexOf(hojeIso)
  const diasDecorridos = idxHoje >= 0 ? idxHoje + 1 : diasAtual.length

  const porBarbeiro: Record<string, ProjecaoBarbeiro> = {}

  for (const b of barbeiros) {
    const historico: CicloHistorico[] = anteriores.map((c) => ({
      mes: c.mesRef,
      ano: c.anoRef,
      total: totalPor.get(`${b.id}|${c.mesRef}-${c.anoRef}`) ?? 0,
      acumuladoPorDia: diasPorCiclo.get(c)!.map((iso) => fotoPor.get(`${b.id}|${iso}`) ?? null),
      totalDias: c.totalDias,
    }))
    // Ciclo sem R$ nenhum não é histórico — é ausência. Deixá-lo entrar
    // arrastaria a fração típica e o crescimento pra baixo.
    const comDados = historico.filter((h) => h.total > 0)

    const projecao = projetar({
      atual: b.comissao,
      diasDecorridos,
      totalDias: ciclo.totalDias,
      acumuladoPorDiaAtual: diasAtual.slice(0, diasDecorridos).map((iso) => fotoPor.get(`${b.id}|${iso}`) ?? null),
      historico: comDados,
      diasTrabalhoMes: b.dias_trabalho_mes ?? opts.diasTrabalhoPadrao ?? null,
    })

    porBarbeiro[b.id] = { ...projecao, barbeiroId: b.id }
  }

  // ── A casa projeta FATURAMENTO, com a própria curva ──
  // Mesma função, outro escopo: a forma vem da soma das curvas diárias de
  // todos os barbeiros; o nível vem do faturamento da casa, com a MESMA
  // precedência do painel (metas.faturamento_acumulado quando existe, senão a
  // soma dos acumulados). Projetar isso somando os cards só funcionaria se a
  // base deles fosse faturamento — quando é comissão, seriam outras contas.
  const { data: metasRaw } = await supabase
    .from('metas')
    .select('mes, ano, faturamento_acumulado')
    .eq('barbearia_id', barbeariaId)
    .in('ano', Array.from(new Set(todos.map((c) => c.anoRef))))

  const fatCasaPor = new Map<string, number>()
  for (const r of (metasRaw ?? []) as { mes: number; ano: number; faturamento_acumulado: number | string | null }[]) {
    const v = Number(r.faturamento_acumulado) || 0
    if (v > 0) fatCasaPor.set(`${r.mes}-${r.ano}`, v)
  }

  /** Faturamento da casa num ciclo, com a precedência do painel. */
  const faturamentoDoCiclo = (mesRef: number, anoRef: number): number => {
    const declarado = fatCasaPor.get(`${mesRef}-${anoRef}`)
    if (declarado && declarado > 0) return declarado
    return ids.reduce((s, id) => s + (totalPor.get(`${id}|${mesRef}-${anoRef}`) ?? 0), 0)
  }

  /** Curva da casa num ciclo: soma do que cada barbeiro registrou no dia. */
  const curvaDaCasa = (dias: string[]) =>
    dias.map((iso) => {
      const soma = ids.reduce((s, id) => s + (fotoPor.get(`${id}|${iso}`) ?? 0), 0)
      return soma > 0 ? soma : null
    })

  const historicoCasa = anteriores.map((c) => {
    const dias = diasPorCiclo.get(c)!
    return {
      mes: c.mesRef, ano: c.anoRef,
      total: faturamentoDoCiclo(c.mesRef, c.anoRef),
      acumuladoPorDia: curvaDaCasa(dias),
      totalDias: c.totalDias,
    }
  }).filter((h) => h.total > 0)

  const diasAteHoje = diasAtual.slice(0, diasDecorridos)
  const curvaAtualCasa = curvaDaCasa(diasAteHoje)

  const projCasa = projetar({
    atual: faturamentoDoCiclo(ciclo.mesRef, ciclo.anoRef),
    diasDecorridos,
    totalDias: ciclo.totalDias,
    acumuladoPorDiaAtual: curvaAtualCasa,
    historico: historicoCasa,
    diasTrabalhoMes: null,
  })

  const anterior = anteriores[anteriores.length - 1]

  return {
    porBarbeiro,
    casa: {
      ...projCasa,
      totalCicloAnterior: faturamentoDoCiclo(anterior.mesRef, anterior.anoRef),
      baseDiferenteDosCards: opts.baseEhComissao,
    },
  }
}
