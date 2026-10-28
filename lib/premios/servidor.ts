/**
 * GAMIFICAÇÃO E PREMIAÇÃO DO CICLO — carregamento ÚNICO, no servidor.
 *
 * Este bloco nasceu dentro de `app/dashboard/page.tsx`. Saiu de lá quando a
 * folha do Financeiro passou a precisar dos MESMOS números: o total de
 * premiação das folhas tem que bater com o bloco "Premiação do mês" do
 * dashboard, e a única forma de garantir isso é os dois lerem o mesmo código.
 *
 * O que mora aqui não é "só umas queries". É um punhado de decisões sutis que,
 * reescritas em outro lugar, dariam números parecidos e errados:
 *   - os pontos são somados a partir de TODAS as campanhas da barbearia, não
 *     só a do mês (lançamento antigo pode apontar pra campanha do mês errado —
 *     bug histórico pré-PR #85; filtrar pelo campanha_id do mês deixava esses
 *     controles de fora e o card mostrava menos que "Ver lançamentos");
 *   - "hoje" é a data real de calendário, não `mes`/`ano` do ciclo — em
 *     barbearia com dia_fechamento != 1 os dois não coincidem;
 *   - o desempate do ranking de pontos é pontos desc + nome pt-BR, igual à
 *     tela do barbeiro, pra 1º e 2º não trocarem de lugar num empate;
 *   - só barbeiro ATIVO entra: lançamento de barbeiro inativado inflava o
 *     total da casa ("comissão fantasma").
 *
 * O cálculo da premiação em si continua sendo `calcularPremiacao` de
 * `lib/premios` — a mesma da tela do barbeiro. Aqui só se montam as entradas.
 *
 * Só leitura, com uma exceção declarada: `garantirCampanha` copia a campanha
 * do ciclo anterior quando falta. Só o dashboard pede isso; a folha do
 * Financeiro lê sem escrever nada.
 */
import { calcularPremiacao, type PremiacaoResumo } from '@/lib/premios'
import { garantirCampanhaCicloAtual } from '@/lib/campanha'
import { dataLocalStr } from '@/lib/utils'
import type { Ciclo } from '@/lib/ciclo'
import type {
  Barbeiro, MetaIndividual, Lancamento, ModoPontos,
  CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario,
} from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

export interface BaseDoCiclo {
  barbeiros: Barbeiro[]
  /** Lançamentos do ciclo, já filtrados pelos barbeiros ATIVOS. */
  lancamentos: Lancamento[]
  ranking: RankingItem[]
}

export type RankingItem = Barbeiro & {
  comissao: number
  atendimentosMes: number
  metaInd: MetaIndividual | null
}

/**
 * Barbeiros ativos + lançamentos do ciclo + meta individual de cada um,
 * ordenados como o ranking da tela. É a entrada de tudo que vem depois.
 */
export async function carregarBaseDoCiclo(
  supabase: Supa,
  barbeariaId: string,
  mes: number,
  ano: number,
  metasIndividuais: MetaIndividual[],
): Promise<BaseDoCiclo> {
  const { data: barbeirosRaw } = await supabase
    .from('barbeiros').select('*')
    .eq('barbearia_id', barbeariaId).eq('ativo', true).order('nome')

  const { data: lancamentosRaw } = await supabase
    .from('lancamentos').select('*')
    .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano)

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]
  // Só lançamento de barbeiro ATIVO entra. Barbeiro inativado some da lista
  // mas seus lançamentos ficavam inflando o total da casa.
  const idsAtivos = new Set(barbeiros.map((b) => b.id))
  const lancamentos = ((lancamentosRaw ?? []) as Lancamento[]).filter((l) => idsAtivos.has(l.barbeiro_id))

  const ranking: RankingItem[] = [...barbeiros]
    .map((b) => {
      const lanc = lancamentos.find((l) => l.barbeiro_id === b.id)
      return {
        ...b,
        comissao: lanc?.comissao_acumulada ?? 0,
        atendimentosMes: (lanc as Lancamento & { numero_atendimentos?: number } | undefined)?.numero_atendimentos ?? 0,
        metaInd: metasIndividuais.find((m) => m.barbeiro_id === b.id) ?? null,
      }
    })
    .sort((a, b) => b.comissao - a.comissao)

  return { barbeiros, lancamentos, ranking }
}

export interface Gamificacao {
  modoAtual: ModoPontos
  campanha: CampanhaComDetalhes | null
  pontosMap: Record<string, number>
  pontosHojePorBarbeiro: Record<string, number>
  rankingPontos: { id: string; pts: number }[]
  rankingPontosBarb: { id: string; pts: number }[]
  rankingPontosRecep: { id: string; pts: number }[]
  premiacao: PremiacaoResumo
}

export async function carregarGamificacao(
  supabase: Supa,
  opts: {
    barbeariaId: string
    mes: number
    ano: number
    ciclo: Ciclo
    ehPeriodoAtual: boolean
    hoje: Date
    barbeiros: Barbeiro[]
    ranking: RankingItem[]
    /** Copia a campanha do ciclo anterior quando falta. Só o dashboard. */
    garantirCampanha?: boolean
  },
): Promise<Gamificacao> {
  const { barbeariaId, mes, ano, ciclo, ehPeriodoAtual, hoje, barbeiros, ranking } = opts
  const garantirCampanha = opts.garantirCampanha ?? false

  // ── Gamificação ──────────────────────────────────────────
  // Se ainda nao existe campanha/modo_mes pra este ciclo mas o anterior tinha,
  // COPIA — assim o dono nao vê "voltou pro padrao" na virada de mes. So
  // dispara pro ciclo atual (nao pra ciclos passados navegados via URL).
  if (ehPeriodoAtual && garantirCampanha) {
    await garantirCampanhaCicloAtual(supabase, barbeariaId, mes, ano)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modoRaw } = await (supabase as any)
    .from('modo_mes').select('modo').eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).single()
  const modoAtual: ModoPontos = (modoRaw?.modo as ModoPontos) ?? 'metas'

  let campanha: CampanhaComDetalhes | null = null
  const pontosMap: Record<string, number> = {}
  const pontosHojePorBarbeiro: Record<string, number> = {}

  if (modoAtual !== 'metas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campRaw } = await (supabase as any)
      .from('campanha').select('*').eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).single()
    if (campRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: servicosRaw } = await (supabase as any)
        .from('campanha_servicos').select('*').eq('campanha_id', campRaw.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: premiosRaw } = await (supabase as any)
        .from('campanha_premios').select('*').eq('campanha_id', campRaw.id).order('posicao')

      // Controles do ciclo: filtra por DATA do ciclo + campanhas da barbearia
      // (NÃO por campanha_id específico). Lançamentos antigos podem ter
      // campanha_id apontando pra campanha do mês errado — bug histórico
      // de pré-PR #85 (lookup usava getMonth() em vez de cicloDeData.mesRef).
      // Filtrar pelo campanha_id selecionado deixava esses lançamentos de
      // fora, fazendo o card mostrar total menor que o "Ver lançamentos".
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todasCampRaw } = await (supabase as any)
        .from('campanha').select('id').eq('barbearia_id', barbeariaId)
      const todasCampIds = ((todasCampRaw ?? []) as { id: string }[]).map(c => c.id)

      // Pontos por serviço: cobre TODAS as campanhas da barbearia, porque um
      // controle pode referenciar servico_id de campanha diferente da do mês.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todosServRaw } = todasCampIds.length > 0 ? await (supabase as any)
        .from('campanha_servicos').select('id, pontos').in('campanha_id', todasCampIds) : { data: [] }
      const pontosPorServico = new Map<string, number>()
      for (const s of (todosServRaw ?? []) as { id: string; pontos: number }[]) {
        pontosPorServico.set(s.id, Number(s.pontos) || 0)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: controlesRaw } = todasCampIds.length > 0 ? await (supabase as any)
        .from('controle_diario')
        .select('barbeiro_id, servico_id, quantidade, data')
        .in('campanha_id', todasCampIds)
        .gte('data', ciclo.inicioIso)
        .lte('data', ciclo.fimIso) : { data: [] }

      campanha = {
        ...campRaw,
        campanha_servicos: (servicosRaw ?? []) as CampanhaServico[],
        campanha_premios:  (premiosRaw  ?? []) as CampanhaPremio[],
      }

      // dataHojeStr = data REAL de hoje (calendário). NÃO usar `mes`/`ano` do
      // ciclo aqui — em barbearias com dia_fechamento != 1, o mesRef do ciclo
      // não bate com o mês calendário atual (ex: dia_fechamento=26, hoje=02/06,
      // mesRef=5, diaAtual=2 → '2026-05-02' = um mês atrás).
      // Pra ciclos passados/futuros, fica string vazia (não existe "hoje" neles).
      const dataHojeStr = ehPeriodoAtual ? dataLocalStr(hoje) : ''

      for (const cd of ((controlesRaw ?? []) as Pick<ControleDiario, 'barbeiro_id' | 'servico_id' | 'quantidade' | 'data'>[])) {
        const pts = pontosPorServico.get(cd.servico_id) ?? 0
        pontosMap[cd.barbeiro_id] = (pontosMap[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
        if (dataHojeStr && cd.data === dataHojeStr) {
          pontosHojePorBarbeiro[cd.barbeiro_id] = (pontosHojePorBarbeiro[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
        }
      }
    }
  }

  // Desempate determinístico: pontos desc, depois nome (pt-BR) — mesmo critério
  // da página do barbeiro, pra 1º/2º não trocarem de lugar num empate.
  const nomePorId = (id: string) => barbeiros.find(b => b.id === id)?.nome ?? ''
  const rankingPontos = Object.entries(pontosMap)
    .map(([id, pts]) => ({ id, pts }))
    .sort((a, b) => b.pts - a.pts || nomePorId(a.id).localeCompare(nomePorId(b.id), 'pt-BR'))

  const rankingPontosBarb  = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo !== 'recepcionista')
  const rankingPontosRecep = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo === 'recepcionista')

  // ── PREMIAÇÃO DO MÊS (bloco do dono) ───────────────────────────────────
  // MESMA função da tela do barbeiro (lib/premios) → o "já garantido" total é
  // exatamente a soma dos individuais que cada barbeiro vê no link dele.
  const premiacao = calcularPremiacao(
    ranking.map(b => ({
      id: b.id, nome: b.nome, tipo: b.tipo,
      comissao: b.comissao,
      pontos: pontosMap[b.id] ?? 0,
      meta: b.metaInd ? {
        bronze_comm: b.metaInd.bronze_comm, bronze_premio: b.metaInd.bronze_premio,
        prata_comm: b.metaInd.prata_comm, prata_premio: b.metaInd.prata_premio,
        ouro_comm: b.metaInd.ouro_comm, ouro_premio: b.metaInd.ouro_premio,
      } : null,
    })),
    campanha && campanha.ativo !== false ? {
      min_pontos: campanha.min_pontos,
      min_pontos_recep: campanha.min_pontos_recep,
      premios: campanha.campanha_premios.map(p => ({ posicao: p.posicao, valor: Number(p.valor) || 0 })),
    } : null,
  )

  return {
    modoAtual, campanha, pontosMap, pontosHojePorBarbeiro,
    rankingPontos, rankingPontosBarb, rankingPontosRecep, premiacao,
  }
}
