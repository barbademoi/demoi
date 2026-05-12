import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nomeMes, calcProgresso, calcTier } from '@/lib/utils'
import { gerarInsightsBarbeiro } from '@/lib/insights'
import BrandLogo from '@/components/BrandLogo'
import BarbeiroClient from './BarbeiroClient'
import { computeHistorico } from './pontos-utils'
import type {
  Barbeiro, MetaIndividual, Lancamento,
  ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario,
} from '@/types/database'

interface Props {
  params: { codigo: string }
}

type LancamentoComNome = Lancamento & { barbeiros: { nome: string } | null }

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

export default async function BarbeiroPage({ params }: Props) {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiroRaw } = await (supabase as any)
    .from('barbeiros').select('*')
    .eq('link_codigo', params.codigo).eq('ativo', true).single()
  if (!barbeiroRaw) notFound()
  const barbeiro = barbeiroRaw as Barbeiro

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeariaRaw } = await (supabase as any)
    .from('barbearias').select('nome, cor_principal')
    .eq('id', barbeiro.barbearia_id).single()
  const barbearia = barbeariaRaw as { nome: string; cor_principal: string } | null

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()
  const diaHoje = hoje.getDate()

  // ── Datas para lançamentos diários ──────────────────────
  const dataHojeStr = toDateStr(hoje)
  const primeiroAtual = `${ano}-${String(mes).padStart(2, '0')}-01`

  const mesAntMes = mes === 1 ? 12 : mes - 1
  const mesAntAno = mes === 1 ? ano - 1 : ano
  const primeiroAnterior = `${mesAntAno}-${String(mesAntMes).padStart(2, '0')}-01`
  const ultimoDiaMesAnt = new Date(ano, mes - 1, 0).getDate()
  const diaAnt = Math.min(diaHoje, ultimoDiaMesAnt)
  const mesmoDiaAnterior = `${mesAntAno}-${String(mesAntMes).padStart(2, '0')}-${String(diaAnt).padStart(2, '0')}`

  // ── Metas ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas').select('id, meta_coletiva, premio_coletivo, faturamento_acumulado')
    .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano).single()
  const meta = metaRaw as { id: string; meta_coletiva: number; premio_coletivo: string | null; faturamento_acumulado: number } | null

  let metaInd: MetaIndividual | null = null
  if (meta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: miRaw } = await (supabase as any)
      .from('metas_individuais').select('*')
      .eq('meta_id', meta.id).eq('barbeiro_id', barbeiro.id).single()
    metaInd = miRaw as MetaIndividual | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancamentoRaw } = await (supabase as any)
    .from('lancamentos').select('*')
    .eq('barbeiro_id', barbeiro.id).eq('mes', mes).eq('ano', ano).single()
  const lancamento = lancamentoRaw as Lancamento | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rankingRaw } = await (supabase as any)
    .from('lancamentos').select('barbeiro_id, comissao_acumulada, barbeiros(nome)')
    .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano)
    .order('comissao_acumulada', { ascending: false })
  const ranking = (rankingRaw ?? []) as unknown as LancamentoComNome[]

  const comissao = lancamento?.comissao_acumulada ?? 0
  const progresso = metaInd ? {
    bronze: calcProgresso(comissao, metaInd.bronze_comm),
    prata:  calcProgresso(comissao, metaInd.prata_comm),
    ouro:   calcProgresso(comissao, metaInd.ouro_comm),
    tier_atual: calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm),
  } : null

  const posicaoRanking = ranking.findIndex(l => l.barbeiro_id === barbeiro.id) + 1
  const totalEquipe = ranking.reduce((s, l) => s + l.comissao_acumulada, 0)
  const faturamentoColetivo = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalEquipe
  const progressoColetivo = meta ? calcProgresso(faturamentoColetivo, meta.meta_coletiva) : 0

  const insights = gerarInsightsBarbeiro({
    comissao,
    metaInd,
    posicaoRanking: posicaoRanking || 99,
    totalBarbeiros: ranking.length,
    totalEquipe: faturamentoColetivo,
    metaColetiva: meta?.meta_coletiva ?? 0,
    barberoNome: barbeiro.nome,
  })

  // ── Lançamentos diários deste barbeiro ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAtualRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('valor')
    .eq('barbeiro_id', barbeiro.id)
    .gte('data', primeiroAtual)
    .lte('data', dataHojeStr)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAnteriorRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('valor')
    .eq('barbeiro_id', barbeiro.id)
    .gte('data', primeiroAnterior)
    .lte('data', mesmoDiaAnterior)

  const acumDiarioAtual   = ((ldAtualRaw    ?? []) as { valor: number }[]).reduce((s, r) => s + Number(r.valor), 0)
  const acumDiarioAnterior = ((ldAnteriorRaw ?? []) as { valor: number }[]).reduce((s, r) => s + Number(r.valor), 0)

  const deltaDiario: number | null = acumDiarioAnterior > 0
    ? Math.round(((acumDiarioAtual - acumDiarioAnterior) / acumDiarioAnterior) * 100)
    : null

  // ── Modo + Gamificação ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modoRaw } = await (supabase as any)
    .from('modo_mes').select('modo')
    .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano).single()
  const modo: ModoPontos = (modoRaw?.modo as ModoPontos) ?? 'metas'

  let campanha: CampanhaComDetalhes | null = null
  let controlesDiario: ControleDiario[] = []
  let pontosTotal = 0
  let rankingPontos: { barbeiro_id: string; pontos: number }[] = []
  const pontosMap: Record<string, number> = {}

  if (modo !== 'metas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campRaw } = await (supabase as any)
      .from('campanha').select('*')
      .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano).single()

    if (campRaw && campRaw.ativo !== false) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: servicosRaw } = await (supabase as any)
        .from('campanha_servicos').select('*').eq('campanha_id', campRaw.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: premiosRaw } = await (supabase as any)
        .from('campanha_premios').select('*').eq('campanha_id', campRaw.id).order('posicao')
      campanha = {
        ...campRaw,
        campanha_servicos: (servicosRaw ?? []) as CampanhaServico[],
        campanha_premios:  (premiosRaw  ?? []) as CampanhaPremio[],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todosControlesRaw } = await (supabase as any)
        .from('controle_diario').select('barbeiro_id, servico_id, quantidade')
        .eq('campanha_id', campRaw.id)

      for (const cd of ((todosControlesRaw ?? []) as Pick<ControleDiario, 'barbeiro_id' | 'servico_id' | 'quantidade'>[])) {
        const pts = campanha!.campanha_servicos.find(s => s.id === cd.servico_id)?.pontos ?? 0
        pontosMap[cd.barbeiro_id] = (pontosMap[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
      }

      rankingPontos = Object.entries(pontosMap)
        .map(([barbeiro_id, pontos]) => ({ barbeiro_id, pontos }))
        .sort((a, b) => b.pontos - a.pontos)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meusControlesRaw } = await (supabase as any)
        .from('controle_diario').select('*')
        .eq('barbeiro_id', barbeiro.id).eq('campanha_id', campRaw.id)
        .order('data', { ascending: false })

      controlesDiario = (meusControlesRaw ?? []) as ControleDiario[]
      pontosTotal = pontosMap[barbeiro.id] ?? 0
    }
  }

  const controleHoje = controlesDiario
    .filter(cd => cd.data === dataHojeStr)
    .reduce((acc, cd) => { acc[cd.servico_id] = cd.quantidade; return acc }, {} as Record<string, number>)

  const historico = campanha
    ? computeHistorico(controlesDiario, campanha.campanha_servicos)
    : []

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-surface">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <BrandLogo size="md" />
          {barbearia && <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <BarbeiroClient
          barbeiro={barbeiro}
          barbeariaName={barbearia?.nome ?? ''}
          mes={mes}
          ano={ano}
          modo={modo}
          metaInd={metaInd}
          lancamento={lancamento}
          progresso={progresso}
          ranking={ranking}
          posicaoRanking={posicaoRanking}
          faturamentoColetivo={faturamentoColetivo}
          progressoColetivo={progressoColetivo}
          metaColetiva={meta?.meta_coletiva ?? 0}
          premioColetivo={meta?.premio_coletivo ?? null}
          insights={insights}
          campanha={campanha}
          controlesDiario={controlesDiario}
          pontosTotal={pontosTotal}
          rankingPontos={rankingPontos}
          pontosMap={pontosMap}
          controleHoje={controleHoje}
          historico={historico}
          acumDiarioAtual={acumDiarioAtual}
          acumDiarioAnterior={acumDiarioAnterior}
          deltaDiario={deltaDiario}
          diaHoje={diaHoje}
          nomeMesAnterior={nomeMes(mesAntMes)}
        />
      </main>
    </div>
  )
}
