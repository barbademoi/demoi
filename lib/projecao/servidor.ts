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
   * Projeção da casa. É a SOMA das individuais, de propósito: o número do
   * bloco geral tem que ser o mesmo que o dono obtém somando os cards.
   */
  casa: {
    esperado: number
    faixa: { conservador: number; otimista: number } | null
    confianca: Projecao['confianca']
    motivos: string[]
    /** Total do ciclo anterior, pra comparação. 0 = não há anterior. */
    totalCicloAnterior: number
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
    .select('barbeiro_id, data, numero_atendimentos')
    .eq('barbearia_id', barbeariaId)
    .in('barbeiro_id', ids)
    .gte('data', anteriores[0].inicioIso)
    .lte('data', ciclo.fimIso)

  const comandaPor = new Map<string, number>() // `${barbeiroId}|${dataIso}` → qtd
  for (const r of (diariosRaw ?? []) as { barbeiro_id: string; data: string; numero_atendimentos: number }[]) {
    comandaPor.set(`${r.barbeiro_id}|${String(r.data).slice(0, 10)}`, Number(r.numero_atendimentos) || 0)
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
      comandasPorDia: diasPorCiclo.get(c)!.map((iso) => comandaPor.get(`${b.id}|${iso}`) ?? 0),
      totalDias: c.totalDias,
    }))
    // Ciclo sem R$ nenhum não é histórico — é ausência. Deixá-lo entrar
    // arrastaria a fração típica e o crescimento pra baixo.
    const comDados = historico.filter((h) => h.total > 0)

    const projecao = projetar({
      atual: b.comissao,
      diasDecorridos,
      totalDias: ciclo.totalDias,
      comandasPorDiaAtual: diasAtual.slice(0, diasDecorridos).map((iso) => comandaPor.get(`${b.id}|${iso}`) ?? 0),
      historico: comDados,
      diasTrabalhoMes: b.dias_trabalho_mes ?? opts.diasTrabalhoPadrao ?? null,
    })

    porBarbeiro[b.id] = { ...projecao, barbeiroId: b.id }
  }

  // ── A casa é a SOMA das individuais ──
  const lista = Object.values(porBarbeiro).filter((p) => p.temProjecao)
  const esperado = lista.reduce((s, p) => s + p.esperado, 0)
  // A faixa da casa soma as pontas de quem tem faixa e usa o esperado de quem
  // não tem — assim a faixa nunca fica mais estreita que a soma dos esperados.
  const conservador = lista.reduce((s, p) => s + (p.faixa ? p.faixa.conservador : p.esperado), 0)
  const otimista = lista.reduce((s, p) => s + (p.faixa ? p.faixa.otimista : p.esperado), 0)

  // A confiança da casa é a PIOR das individuais: o elo mais fraco é que
  // manda quando os números são somados.
  const ordem = { baixa: 0, media: 1, alta: 2 } as const
  const confianca = lista.length === 0
    ? 'baixa' as const
    : lista.reduce((pior, p) => (ordem[p.confianca] < ordem[pior] ? p.confianca : pior), 'alta' as Projecao['confianca'])

  const motivos = Array.from(new Set(lista.flatMap((p) => p.motivos))).slice(0, 3)

  const anterior = anteriores[anteriores.length - 1]
  const totalCicloAnterior = ids.reduce(
    (s, id) => s + (totalPor.get(`${id}|${anterior.mesRef}-${anterior.anoRef}`) ?? 0),
    0,
  )

  return {
    porBarbeiro,
    casa: {
      esperado,
      faixa: lista.some((p) => p.faixa) ? { conservador, otimista } : null,
      confianca,
      motivos: motivos.length > 0 ? motivos : ['sem histórico ainda'],
      totalCicloAnterior,
    },
  }
}
