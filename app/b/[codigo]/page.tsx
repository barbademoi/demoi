import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcProgresso, calcTier, dataLocalStr } from '@/lib/utils'
import { cicloAtual, calcDiasUteisCiclo, cicloDeData } from '@/lib/ciclo'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import { gerarInsightsBarbeiro } from '@/lib/insights'
import { obterMensagemDiaria } from '@/lib/ia-mensagem'
import { buscarHistoricoMeses } from '@/lib/historicoMeses'
import BrandLogo from '@/components/BrandLogo'
import BarbeiroClient from './BarbeiroClient'
import { computeHistorico } from './pontos-utils'
import type {
  Barbeiro, MetaIndividual, Lancamento,
  ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario,
} from '@/types/database'

interface Props {
  params: { codigo: string }
  searchParams?: { mes?: string; ano?: string }
}

// Tela do barbeiro precisa estar sempre em tempo real: comissão, ranking,
// lançamentos e config de visibilidade mudam a qualquer momento pelo dono.
// Sem isto, o Next servia versão cacheada (ranking aparecia mesmo após o
// dono trocar pra "Só o próprio progresso").
export const dynamic = 'force-dynamic'

type LancamentoComNome = Lancamento & { barbeiros: { nome: string } | null }

export default async function BarbeiroPage({ params, searchParams }: Props) {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiroRaw } = await (supabase as any)
    .from('barbeiros').select('*')
    .eq('link_codigo', params.codigo).eq('ativo', true).single()
  if (!barbeiroRaw) notFound()
  const barbeiro = barbeiroRaw as Barbeiro

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeariaRaw } = await (supabase as any)
    .from('barbearias').select('nome, cor_principal, visibilidade_ranking, modalidade, dia_fechamento, mostrar_ticket_medio, mostrar_faturamento_geral, regras_gerais')
    .eq('id', barbeiro.barbearia_id).single()
  const barbearia = barbeariaRaw as {
    nome: string
    cor_principal: string
    visibilidade_ranking: 'completo' | 'posicoes' | 'proprio' | null
    modalidade: string | null
    dia_fechamento: number | null
    mostrar_ticket_medio: boolean | null
    mostrar_faturamento_geral: boolean | null
    regras_gerais: string[] | null
  } | null
  const mostrarTicketMedio = barbearia?.mostrar_ticket_medio ?? false
  const mostrarFaturamentoGeral = barbearia?.mostrar_faturamento_geral ?? true

  const visibilidadeRanking: 'completo' | 'posicoes' | 'proprio' =
    barbearia?.visibilidade_ranking ?? 'completo'
  const isAutonomo = barbearia?.modalidade === 'sozinho'

  console.log('[/b/[codigo]]', { codigo: params.codigo, barbearia_id: barbeiro.barbearia_id, visibilidade_ranking_lido: barbearia?.visibilidade_ranking, visibilidadeRanking })
  const diaFechamento = barbearia?.dia_fechamento ?? 1

  const hoje = new Date()
  const cicloHoje = cicloAtual(diaFechamento, hoje)
  const mesAtual = cicloHoje.mesRef
  const anoAtual = cicloHoje.anoRef

  // Período selecionado via ?mes=X&ano=Y (default = ciclo atual). Floor 2024-01.
  const mesParam = parseInt(searchParams?.mes ?? '', 10)
  const anoParam = parseInt(searchParams?.ano ?? '', 10)
  let mes = mesAtual
  let ano = anoAtual
  if (Number.isFinite(mesParam) && Number.isFinite(anoParam)
      && mesParam >= 1 && mesParam <= 12 && anoParam >= 2024) {
    mes = mesParam
    ano = anoParam
  }
  const ehPeriodoAtual = mes === mesAtual && ano === anoAtual
  const ehPeriodoPassado = ano < anoAtual || (ano === anoAtual && mes < mesAtual)

  const ciclo = ehPeriodoAtual
    ? cicloHoje
    : cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)
  const diaAtual = hoje.getDate()

  // Navegação entre meses: piso 2024-01; futuro só se metas existem.
  const podeVoltar = !(ano === 2024 && mes === 1)
  let nextMes = mes + 1, nextAno = ano
  if (nextMes > 12) { nextMes = 1; nextAno += 1 }
  const nextEhFuturo = nextAno > anoAtual || (nextAno === anoAtual && nextMes > mesAtual)
  let podeAvancar = !nextEhFuturo
  if (nextEhFuturo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: nextMeta } = await (supabase as any)
      .from('metas').select('id')
      .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', nextMes).eq('ano', nextAno)
      .maybeSingle()
    podeAvancar = !!nextMeta
  }

  // ── Metas ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas').select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata, premio_coletivo, premio_coletivo_bronze, premio_coletivo_prata, faturamento_acumulado')
    .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano).single()
  const meta = metaRaw as {
    id: string
    meta_coletiva: number; meta_coletiva_bronze: number; meta_coletiva_prata: number
    premio_coletivo: string | null; premio_coletivo_bronze: string | null; premio_coletivo_prata: string | null
    faturamento_acumulado: number
  } | null

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

  // Histórico 4 meses pra qualquer modalidade — alimenta Comparativo,
  // HistoricoMeses e TicketMedio. Comissão mês anterior derivada do array.
  const historicoMeses = await buscarHistoricoMeses(supabase, barbeiro.id, mes, ano, 4, diaFechamento)
  const comissaoMesAnterior = historicoMeses[historicoMeses.length - 2]?.comissao ?? 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rankingRaw } = await (supabase as any)
    .from('lancamentos').select('barbeiro_id, comissao_acumulada, barbeiros(nome)')
    .eq('barbearia_id', barbeiro.barbearia_id).eq('mes', mes).eq('ano', ano)
    .order('comissao_acumulada', { ascending: false })
  const ranking = (rankingRaw ?? []) as unknown as LancamentoComNome[]

  // Total de barbeiros ativos da barbearia (usado pela IA — mais preciso que ranking.length)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalBarbeirosAtivos } = await (supabase as any)
    .from('barbeiros')
    .select('id', { count: 'exact', head: true })
    .eq('barbearia_id', barbeiro.barbearia_id)
    .eq('ativo', true)
    .neq('tipo', 'recepcionista')

  const comissao = lancamento?.comissao_acumulada ?? 0
  const progresso = metaInd ? {
    bronze: calcProgresso(comissao, metaInd.bronze_comm),
    prata:  calcProgresso(comissao, metaInd.prata_comm),
    ouro:   calcProgresso(comissao, metaInd.ouro_comm),
    tier_atual: calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm),
  } : null

  const posicaoRanking = ranking.findIndex(l => l.barbeiro_id === barbeiro.id) + 1
  const totalEquipe = ranking.reduce((s, l) => s + l.comissao_acumulada, 0)
  const faturamentoColetivoReal = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalEquipe
  // % calculado a partir do real, por tier — preservados mesmo quando o R$ vira 0.
  // Mantém a barra+% funcionando no client sem precisar do valor R$ exposto.
  const progressoColetivo = meta ? calcProgresso(faturamentoColetivoReal, meta.meta_coletiva) : 0
  const progressoColetivoBronze = meta?.meta_coletiva_bronze
    ? calcProgresso(faturamentoColetivoReal, meta.meta_coletiva_bronze) : 0
  const progressoColetivoPrata = meta?.meta_coletiva_prata
    ? calcProgresso(faturamentoColetivoReal, meta.meta_coletiva_prata) : 0
  // Quando o dono desligou "Mostrar faturamento geral", zera o R$ ANTES
  // de mandar pro client — não vaza nem via network/devtools.
  const faturamentoColetivo = mostrarFaturamentoGeral ? faturamentoColetivoReal : 0

  const insights = gerarInsightsBarbeiro({
    comissao,
    metaInd,
    posicaoRanking: posicaoRanking || 99,
    totalBarbeiros: ranking.length,
    totalEquipe: faturamentoColetivo,
    metaColetiva: meta?.meta_coletiva ?? 0,
    barberoNome: barbeiro.nome,
  })

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

      // Controles do ciclo: filtra por DATA + campanhas da barbearia (NÃO por
      // campanha_id específico). Lançamentos antigos podem ter campanha_id
      // apontando pra campanha do mês errado (bug histórico pré-PR #85) —
      // filtrar por campanha_id deixava esses lançamentos de fora.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todasCampRaw } = await (supabase as any)
        .from('campanha').select('id').eq('barbearia_id', barbeiro.barbearia_id)
      const todasCampIds = ((todasCampRaw ?? []) as { id: string }[]).map(c => c.id)

      // Pontos por serviço cobrindo TODAS as campanhas da barbearia
      // (um controle pode referenciar servico_id de campanha diferente).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todosServRaw } = todasCampIds.length > 0 ? await (supabase as any)
        .from('campanha_servicos').select('id, pontos').in('campanha_id', todasCampIds) : { data: [] }
      const pontosPorServico = new Map<string, number>()
      for (const s of (todosServRaw ?? []) as { id: string; pontos: number }[]) {
        pontosPorServico.set(s.id, Number(s.pontos) || 0)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todosControlesRaw } = todasCampIds.length > 0 ? await (supabase as any)
        .from('controle_diario').select('barbeiro_id, servico_id, quantidade')
        .in('campanha_id', todasCampIds)
        .gte('data', ciclo.inicioIso)
        .lte('data', ciclo.fimIso) : { data: [] }

      for (const cd of ((todosControlesRaw ?? []) as Pick<ControleDiario, 'barbeiro_id' | 'servico_id' | 'quantidade'>[])) {
        const pts = pontosPorServico.get(cd.servico_id) ?? 0
        pontosMap[cd.barbeiro_id] = (pontosMap[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
      }

      rankingPontos = Object.entries(pontosMap)
        .map(([barbeiro_id, pontos]) => ({ barbeiro_id, pontos }))
        .sort((a, b) => b.pontos - a.pontos)

      // Meus controles do ciclo (pra histórico/detalhe): mesma lógica —
      // filtra por barbeiro + data, não por campanha_id.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meusControlesRaw } = todasCampIds.length > 0 ? await (supabase as any)
        .from('controle_diario').select('*')
        .eq('barbeiro_id', barbeiro.id)
        .in('campanha_id', todasCampIds)
        .gte('data', ciclo.inicioIso)
        .lte('data', ciclo.fimIso)
        .order('data', { ascending: false }) : { data: [] }

      controlesDiario = (meusControlesRaw ?? []) as ControleDiario[]
      pontosTotal = pontosMap[barbeiro.id] ?? 0
    }
  }

  const dataHojeStr = dataLocalStr(hoje)
  const controleHoje = controlesDiario
    .filter(cd => cd.data === dataHojeStr)
    .reduce((acc, cd) => { acc[cd.servico_id] = cd.quantidade; return acc }, {} as Record<string, number>)

  const historico = campanha
    ? computeHistorico(controlesDiario, campanha.campanha_servicos)
    : []

  // ── Mensagem IA ────────────────────────────────────────
  // Em mês fechado, usa o fim do ciclo como "hoje" pra dias úteis fazerem sentido.
  const refHoje = ehPeriodoAtual ? hoje : ciclo.fim
  const { diasUteisCorridos, diasUteisRestantes, diasTotaisCiclo, diasRestantesCiclo } = calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, refHoje)
  const diasCorridos = diasTotaisCiclo - diasRestantesCiclo
  const diasRestantes = diasRestantesCiclo

  const mensagemIA = await obterMensagemDiaria({
    barbeiro_id: barbeiro.id,
    nome: barbeiro.nome,
    comissao,
    metaInd,
    diasRestantes,
    diasCorridos,
    diasUteisCorridos,
    diasUteisRestantes,
    posicaoRanking,            // 0 = não está no ranking; ia-mensagem.ts trata
    totalBarbeiros: totalBarbeirosAtivos ?? ranking.length,
  })

  // ── Celebrações já exibidas ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: celebracoesRaw } = await (supabase as any)
    .from('celebracoes')
    .select('tier')
    .eq('barbeiro_id', barbeiro.id)
    .eq('mes', mes)
    .eq('ano', ano)
  const tiersJaCelebrados: string[] = (celebracoesRaw ?? []).map((c: { tier: string }) => c.tier)

  // ── Feedbacks de clientes ─────────────────────────────────────
  // Lista os feedbacks em que esse barbeiro foi marcado como
  // "quem te atendeu" — inclui notas baixas e comentários ruins.
  // Página é pública via link_codigo (segredo do barbeiro), então uso
  // admin client pra pular RLS, filtrando estritamente por barbeiro_id.
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: feedbacksRaw } = await (admin as any)
    .from('feedbacks_cliente')
    .select('id, estrelas, comentario, nome_cliente, data, created_at')
    .eq('barbeiro_id', barbeiro.id)
    .eq('arquivado', false)
    .order('created_at', { ascending: false })
    .limit(100)
  const feedbacksDoBarbeiro = (feedbacksRaw ?? []) as Array<{
    id: string
    estrelas: number
    comentario: string | null
    nome_cliente: string | null
    data: string
    created_at: string
  }>

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-surface">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <BrandLogo size="md" />
          {barbearia && <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <MonthNavigator
          mesSel={mes}
          anoSel={ano}
          mesAtual={mesAtual}
          anoAtual={anoAtual}
          diaFechamento={diaFechamento}
          podeVoltar={podeVoltar}
          podeAvancar={podeAvancar}
          hrefBase={`/b/${params.codigo}`}
        />
        {ehPeriodoPassado && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-200 text-xs font-sans leading-relaxed">
              🕒 Histórico de <span className="font-semibold capitalize">{ciclo.label}</span>.
            </p>
            <a
              href={`/b/${params.codigo}`}
              className="text-amber-200 hover:text-amber-100 text-xs font-sans underline whitespace-nowrap shrink-0"
            >
              Voltar ao atual
            </a>
          </div>
        )}
        <BarbeiroClient
          barbeiro={barbeiro}
          barbeariaName={barbearia?.nome ?? ''}
          mes={mes}
          ano={ano}
          diaAtual={diaAtual}
          diasRestantes={diasRestantes}
          diasUteisCorridos={diasUteisCorridos}
          diasUteisRestantes={diasUteisRestantes}
          modo={modo}
          metaInd={metaInd}
          lancamento={lancamento}
          progresso={progresso}
          ranking={ranking}
          posicaoRanking={posicaoRanking}
          faturamentoColetivo={faturamentoColetivo}
          progressoColetivo={progressoColetivo}
          progressoColetivoBronze={progressoColetivoBronze}
          progressoColetivoPrata={progressoColetivoPrata}
          metaColetiva={meta?.meta_coletiva ?? 0}
          metaColetivaBronze={meta?.meta_coletiva_bronze ?? 0}
          metaColetivaPrata={meta?.meta_coletiva_prata ?? 0}
          premioColetivo={meta?.premio_coletivo ?? null}
          premioColetivoBronze={meta?.premio_coletivo_bronze ?? null}
          premioColetivoPrata={meta?.premio_coletivo_prata ?? null}
          insights={insights}
          mensagemIA={mensagemIA}
          tiersJaCelebrados={tiersJaCelebrados}
          campanha={campanha}
          controlesDiario={controlesDiario}
          pontosTotal={pontosTotal}
          rankingPontos={rankingPontos}
          pontosMap={pontosMap}
          controleHoje={controleHoje}
          historico={historico}
          visibilidadeRanking={visibilidadeRanking}
          isAutonomo={isAutonomo}
          comissaoMesAnterior={comissaoMesAnterior}
          historicoMeses={historicoMeses}
          cicloLabel={ciclo.label}
          diaFechamento={diaFechamento}
          mostrarTicketMedio={mostrarTicketMedio}
          mostrarFaturamentoGeral={mostrarFaturamentoGeral}
          feedbacksDoBarbeiro={feedbacksDoBarbeiro}
          regrasGerais={barbearia?.regras_gerais ?? null}
        />
      </main>
    </div>
  )
}
