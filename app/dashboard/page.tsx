import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcProgresso, dataLocalStr } from '@/lib/utils'
import { cicloAtual, calcDiasUteisCiclo, cicloDeData } from '@/lib/ciclo'
import { getPlatformStats } from '@/lib/stats'
import { buscarHistoricoMesesPorBarbeiros, buscarHistoricoBarbearia, type HistoricoMes } from '@/lib/historicoMeses'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import LogoUpload from '@/components/dashboard/LogoUpload'
import ModoMesSelector from '@/components/dashboard/ModoMesSelector'
import CampanhaModal from '@/components/dashboard/CampanhaModal'
import CampanhaToggle from '@/components/dashboard/CampanhaToggle'
import ResumoReuniaoModal from '@/components/dashboard/ResumoReuniaoModal'
import DashboardShell from '@/components/dashboard/DashboardShell'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import FecharMesButton from '@/components/dashboard/FecharMesButton'
import type { Barbeiro, MetaIndividual, Lancamento, ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario } from '@/types/database'

type UsuarioComBarbearia = {
  barbearia_id: string
  senha_temporaria: boolean
  barbearias: { id: string; nome: string; logo_url: string | null; onboarding_completo: boolean; modalidade: string | null; dia_fechamento: number | null; mostrar_ticket_medio: boolean | null; mostrar_faturamento_geral: boolean | null }
}

type MetaSimples = {
  id: string
  meta_coletiva: number
  meta_coletiva_bronze: number
  meta_coletiva_prata: number
  premio_coletivo: string | null
  premio_coletivo_bronze: string | null
  premio_coletivo_prata: string | null
  faturamento_acumulado: number
  numero_atendimentos: number
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { mes?: string; ano?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, senha_temporaria, barbearias(id, nome, logo_url, onboarding_completo, modalidade, dia_fechamento, mostrar_ticket_medio, mostrar_faturamento_geral)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  // Segunda camada: garante que usuários com senha temporária troquem antes de acessar
  if (usuario.senha_temporaria) redirect('/redefinir-senha-obrigatoria')

  // Segunda camada: garante que onboarding seja concluído antes do dashboard
  if (usuario.barbearias?.onboarding_completo === false) redirect('/onboarding/passo-1')

  const barbearia = usuario.barbearias
  if (!barbearia) {
    console.error('[dashboard] barbearia não encontrada para usuario:', user.id)
    redirect('/login')
  }
  const hoje = new Date()
  const diaFechamento = barbearia.dia_fechamento ?? 1
  const mostrarTicketMedio = barbearia.mostrar_ticket_medio ?? false
  const mostrarFaturamentoGeral = barbearia.mostrar_faturamento_geral ?? true
  const cicloHoje = cicloAtual(diaFechamento, hoje)
  const mesAtual = cicloHoje.mesRef
  const anoAtual = cicloHoje.anoRef

  // Período selecionado pelo dono via ?mes=X&ano=Y (default = ciclo atual).
  // Floor 2024-01 (constraint da tabela metas).
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

  // Navegação: piso é 2024-01 (constraint do schema metas); avançar pra futuro
  // só se metas configuradas pra o próximo período (UX: não navegar pra
  // meses vazios sem propósito).
  const podeVoltar = !(ano === 2024 && mes === 1)
  let nextMes = mes + 1, nextAno = ano
  if (nextMes > 12) { nextMes = 1; nextAno += 1 }
  const nextEhFuturo = nextAno > anoAtual || (nextAno === anoAtual && nextMes > mesAtual)
  let podeAvancar = !nextEhFuturo
  if (nextEhFuturo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: nextMeta } = await (supabase as any)
      .from('metas').select('id')
      .eq('barbearia_id', barbearia.id).eq('mes', nextMes).eq('ano', nextAno)
      .maybeSingle()
    podeAvancar = !!nextMeta
  }

  // Status do "mês fechado" — bloqueia edições via save-actions; UI esconde botões.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mesFechRaw } = await (supabase as any)
    .from('meses_fechados').select('fechado_em')
    .eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano)
    .maybeSingle() as { data: { fechado_em: string } | null }
  const mesFechado = !!mesFechRaw
  const mesFechadoEm = mesFechRaw?.fechado_em ?? null

  // Pra o ciclo selecionado, usa o início desse mês/ano com o dia de fechamento
  // — assim cicloDeData devolve as datas do ciclo certo (não só o label).
  const ciclo = ehPeriodoAtual
    ? cicloHoje
    // Usa o dia de fechamento como ponto que CAI dentro do ciclo desejado.
    : cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)

  const diaAtual = hoje.getDate()
  const { diasUteisCorridos, diasUteisRestantes, diasRestantesCiclo } =
    ehPeriodoAtual
      ? calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, hoje)
      // Mês fechado/futuro: usa as datas-limite como se "hoje" fosse o fim do ciclo
      : calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, ciclo.fim)
  const diasRestantes = diasRestantesCiclo

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata, premio_coletivo, premio_coletivo_bronze, premio_coletivo_prata, faturamento_acumulado, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as MetaSimples | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metasIndRaw } = meta ? await (supabase as any)
    .from('metas_individuais')
    .select('*')
    .eq('meta_id', meta.id) : { data: null }

  const metasIndividuais = (metasIndRaw ?? []) as MetaIndividual[]

  // Quando o mês atual ainda não tem metas configuradas, busca a meta mais
  // recente da barbearia pra pré-preencher o form de "Configurar metas".
  // Só leitura — nada é escrito até o dono clicar em Salvar (que cria registros
  // novos para o mês atual via app/dashboard/metas/actions.ts).
  let metasParaForm: MetaIndividual[] = metasIndividuais
  let metaColetivaParaForm:       number | undefined = meta?.meta_coletiva
  let metaColetivaBronzeParaForm: number | undefined = meta?.meta_coletiva_bronze
  let metaColetivaPrataParaForm:  number | undefined = meta?.meta_coletiva_prata
  let premioColetivoParaForm:       string | undefined = meta?.premio_coletivo        ?? undefined
  let premioColetivoBronzeParaForm: string | undefined = meta?.premio_coletivo_bronze ?? undefined
  let premioColetivoPrataParaForm:  string | undefined = meta?.premio_coletivo_prata  ?? undefined
  let herdadoDeMesAnterior = false

  if (!meta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: metaAnteriorRaw } = await (supabase as any)
      .from('metas')
      .select('id, meta_coletiva, meta_coletiva_bronze, meta_coletiva_prata, premio_coletivo, premio_coletivo_bronze, premio_coletivo_prata')
      .eq('barbearia_id', barbearia.id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(1)
      .maybeSingle()

    const metaAnterior = metaAnteriorRaw as {
      id: string
      meta_coletiva: number; meta_coletiva_bronze: number; meta_coletiva_prata: number
      premio_coletivo: string | null; premio_coletivo_bronze: string | null; premio_coletivo_prata: string | null
    } | null

    if (metaAnterior) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: metasAntRaw } = await (supabase as any)
        .from('metas_individuais')
        .select('*')
        .eq('meta_id', metaAnterior.id)

      metasParaForm = (metasAntRaw ?? []) as MetaIndividual[]
      metaColetivaParaForm       = metaAnterior.meta_coletiva
      metaColetivaBronzeParaForm = metaAnterior.meta_coletiva_bronze
      metaColetivaPrataParaForm  = metaAnterior.meta_coletiva_prata
      premioColetivoParaForm       = metaAnterior.premio_coletivo        ?? undefined
      premioColetivoBronzeParaForm = metaAnterior.premio_coletivo_bronze ?? undefined
      premioColetivoPrataParaForm  = metaAnterior.premio_coletivo_prata  ?? undefined
      herdadoDeMesAnterior = true
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancamentosRaw } = await (supabase as any)
    .from('lancamentos')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]
  const lancamentos = (lancamentosRaw ?? []) as Lancamento[]

  const totalComissoes = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const faturamentoReal = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalComissoes
  // % calculado a partir do faturamento real — preservado mesmo quando
  // o R$ é ocultado, pra alimentar o anel/barra de progresso da UI.
  const progressoColetivo = meta ? calcProgresso(faturamentoReal, meta.meta_coletiva) : 0
  // Quando o dono desliga "Mostrar faturamento geral", zera o valor que vai
  // pro client — UI/cards/anel ficam só com %.
  const faturamentoExibido = mostrarFaturamentoGeral ? faturamentoReal : 0

  const ranking = [...barbeiros]
    .map(b => {
      const lanc = lancamentos.find(l => l.barbeiro_id === b.id)
      return {
        ...b,
        comissao: lanc?.comissao_acumulada ?? 0,
        atendimentosMes: (lanc as Lancamento & { numero_atendimentos?: number } | undefined)?.numero_atendimentos ?? 0,
        metaInd: metasIndividuais.find(m => m.barbeiro_id === b.id) ?? null,
      }
    })
    .sort((a, b) => b.comissao - a.comissao)

  const rankingBarbeiros = ranking.filter(b => b.tipo !== 'recepcionista')
  const rankingRecepcionistas = ranking.filter(b => b.tipo === 'recepcionista')

  // Recepcionistas participam só das pontuações (campanha), não das metas de
  // comissão — então ficam de fora da configuração de metas individuais.
  const barbeirosMetas = barbeiros.filter(b => b.tipo !== 'recepcionista')

  // ── Gamificação ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modoRaw } = await (supabase as any)
    .from('modo_mes').select('modo').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
  const modoAtual: ModoPontos = (modoRaw?.modo as ModoPontos) ?? 'metas'

  let campanha: CampanhaComDetalhes | null = null
  const pontosMap: Record<string, number> = {}
  const pontosHojePorBarbeiro: Record<string, number> = {}

  if (modoAtual !== 'metas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campRaw } = await (supabase as any)
      .from('campanha').select('*').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
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
        .from('campanha').select('id').eq('barbearia_id', barbearia.id)
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

  const rankingPontos = Object.entries(pontosMap)
    .map(([id, pts]) => ({ id, pts }))
    .sort((a, b) => b.pts - a.pts)

  const rankingPontosBarb  = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo !== 'recepcionista')
  const rankingPontosRecep = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo === 'recepcionista')

  const platformStats = await getPlatformStats()
  const isAutonomo = barbearia.modalidade === 'sozinho'

  // ── Histórico 4 meses pra todos os barbeiros (qualquer modalidade) ──
  // No autônomo, alimenta os cards de Comparativo/Histórico/Ticket no hero.
  // Em equipe, alimenta os mesmos cards quando o dono filtra um barbeiro específico.
  const idsParaHistorico = ranking.map(r => r.id)
  const [historicoPorBarbeiro, historicoBarbearia] = await Promise.all([
    buscarHistoricoMesesPorBarbeiros(supabase, idsParaHistorico, mes, ano, 4, diaFechamento),
    // Histórico coletivo da barbearia (faturamento total + atendimentos somados) —
    // alimenta os 3 cards na visão "Todos" do dashboard quando equipe.
    buscarHistoricoBarbearia(supabase, barbearia.id, mes, ano, 4, diaFechamento),
  ])

  // Compat com a UI atual do autônomo: deriva o array do único barbeiro
  const historicoMeses: HistoricoMes[] = isAutonomo && rankingBarbeiros[0]
    ? (historicoPorBarbeiro[rankingBarbeiros[0].id] ?? [])
    : []
  const comissaoMesAnterior = historicoMeses[historicoMeses.length - 2]?.comissao ?? 0
  const faturamentoMesAnteriorReal = historicoBarbearia[historicoBarbearia.length - 2]?.comissao ?? 0
  // Mesmo critério: zera o coletivo + histórico da barbearia quando o
  // toggle está off. Histórico individual (de cada barbeiro) NÃO é afetado.
  const faturamentoMesAnterior = mostrarFaturamentoGeral ? faturamentoMesAnteriorReal : 0
  const historicoBarbeariaExibido = mostrarFaturamentoGeral ? historicoBarbearia : []

  return (
    <DashboardShell
      barbeariaNome={barbearia.nome}
      cicloLabel={ciclo.label}
      isAutonomo={isAutonomo}
      comissaoMesAnterior={comissaoMesAnterior}
      historicoMeses={historicoMeses}
      historicoPorBarbeiro={historicoPorBarbeiro}
      historicoBarbearia={historicoBarbeariaExibido}
      faturamentoMesAnterior={faturamentoMesAnterior}
      mostrarFaturamentoGeral={mostrarFaturamentoGeral}
      statsBarbearias={platformStats.barbearias}
      statsBarbeiros={platformStats.barbeiros}
      barbeariaLogoUrl={barbearia.logo_url}
      mostrarTicketMedio={mostrarTicketMedio}
      ehPeriodoAtual={ehPeriodoAtual}
      ehPeriodoPassado={ehPeriodoPassado}
      monthNavigatorSlot={
        <MonthNavigator
          mesSel={mes}
          anoSel={ano}
          mesAtual={mesAtual}
          anoAtual={anoAtual}
          diaFechamento={diaFechamento}
          podeVoltar={podeVoltar}
          podeAvancar={podeAvancar}
          hrefBase="/dashboard"
        />
      }
      mes={mes}
      ano={ano}
      meta={meta}
      faturamentoExibido={faturamentoExibido}
      progressoColetivo={progressoColetivo}
      rankingBarbeiros={rankingBarbeiros}
      rankingRecepcionistas={rankingRecepcionistas}
      modoAtual={modoAtual}
      campanha={campanha}
      pontosMap={pontosMap}
      pontosHojePorBarbeiro={pontosHojePorBarbeiro}
      rankingPontosBarb={rankingPontosBarb}
      rankingPontosRecep={rankingPontosRecep}
      diaAtual={diaAtual}
      diasRestantes={diasRestantes}
      diasUteisCorridos={diasUteisCorridos}
      diasUteisRestantes={diasUteisRestantes}
      logoUploadSlot={<LogoUpload logoUrl={barbearia.logo_url} nomeAbrev={barbearia.nome[0]} />}
      faturamentoEditSlot={null}
      modoMesSlot={<ModoMesSelector modoAtual={modoAtual} mes={mes} ano={ano} />}
      novoBarbeiroSlot={<NovoBarbeiroModal />}
      novaRecepcionistaSlot={<NovoBarbeiroModal tipo="recepcionista" />}
      metasSlot={modoAtual !== 'pontos' && !mesFechado ? (
        <MetasModal
          barbeiros={barbeirosMetas}
          metasAtuais={metasParaForm}
          metaColetiva={metaColetivaParaForm}
          metaColetivaBronze={metaColetivaBronzeParaForm}
          metaColetivaPrata={metaColetivaPrataParaForm}
          faturamentoAcumulado={meta?.faturamento_acumulado}
          premioColetivo={premioColetivoParaForm}
          premioColetivoBronze={premioColetivoBronzeParaForm}
          premioColetivoPrata={premioColetivoPrataParaForm}
          mes={mes}
          ano={ano}
          herdadoDeMesAnterior={herdadoDeMesAnterior}
          diaFechamento={diaFechamento}
        />
      ) : null}
      campanhaSlot={modoAtual !== 'metas' && !mesFechado ? (
        <CampanhaModal campanha={campanha} mes={mes} ano={ano} />
      ) : null}
      campanhaToggleSlot={modoAtual !== 'metas' && !mesFechado && campanha ? (
        <CampanhaToggle campanhaId={campanha.id} ativo={campanha.ativo} />
      ) : null}
      mesFechado={mesFechado}
      mesFechadoEm={mesFechadoEm}
      fecharMesSlot={
        <FecharMesButton mes={mes} ano={ano} fechado={mesFechado} />
      }
      resumoReuniaoSlot={<ResumoReuniaoModal mes={mes} ano={ano} diaFechamento={diaFechamento} />}
    />
  )
}
