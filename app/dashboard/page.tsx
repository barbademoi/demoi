import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcProgresso, dataLocalStr } from '@/lib/utils'
import { cicloAtual, calcDiasUteisCiclo, cicloDeData, hojeBrasil } from '@/lib/ciclo'
import { garantirCampanhaCicloAtual } from '@/lib/campanha'
import { getPlatformStats } from '@/lib/stats'
import { buscarHistoricoMesesPorBarbeiros, buscarHistoricoBarbearia, type HistoricoMes } from '@/lib/historicoMeses'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import LembreteMetaModal from '@/components/dashboard/LembreteMetaModal'
import { montarLembreteMeta } from '@/lib/metas/lembreteServer'
import LogoUpload from '@/components/dashboard/LogoUpload'
import ModoMesSelector from '@/components/dashboard/ModoMesSelector'
import CampanhaModal from '@/components/dashboard/CampanhaModal'
import CampanhaToggle from '@/components/dashboard/CampanhaToggle'
import ResumoReuniaoModal from '@/components/dashboard/ResumoReuniaoModal'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BrindoletaStatus } from '@/lib/brindoleta/config'
import { brindoletaLiberada } from '@/lib/brindoleta/liberacao'
import { BRINDOLETA_PRICE_LABEL } from '@/lib/brindoleta/config'
import { decidirPopupBrindoleta } from '@/lib/brindoleta/popup'
import { carregarBaseDoCiclo, carregarGamificacao } from '@/lib/premios/servidor'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import FecharMesButton from '@/components/dashboard/FecharMesButton'
import DestaquesMes from '@/components/dashboard/DestaquesMes'
import { calcularDestaquesMes } from '@/lib/destaquesMes'
import { montarComparativoPeriodo } from '@/lib/comparativoPeriodo'
import { verificarAssinatura } from '@/lib/assinatura/verificar'
import AvisoAssinatura from '@/components/dashboard/AvisoAssinatura'
import type { Barbeiro, MetaIndividual, Lancamento, ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario } from '@/types/database'

type UsuarioComBarbearia = {
  barbearia_id: string
  senha_temporaria: boolean
  barbearias: { id: string; nome: string; logo_url: string | null; onboarding_completo: boolean; modalidade: string | null; dia_fechamento: number | null; mostrar_ticket_medio: boolean | null; mostrar_faturamento_geral: boolean | null; regras_gerais: string[] | null; dias_trabalho_padrao: number | null; modo_meta: 'faturamento' | 'comissao' | 'ambos' | null; base_meta: 'faturamento' | 'comissao' | null }
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
    .select('barbearia_id, senha_temporaria, barbearias(id, nome, logo_url, onboarding_completo, modalidade, dia_fechamento, mostrar_ticket_medio, mostrar_faturamento_geral, regras_gerais, dias_trabalho_padrao, modo_meta, base_meta)')
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

  // Brindoleta: status da própria barbearia controla o que aparece
  // (promo/checkout se não tem, painel se ativa).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brindoletaLicenseRaw } = await (supabase as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', barbearia.id)
    .maybeSingle()
  // Assinante tem a Brindoleta sem nunca ter criado licença — a linha não
  // existe e `status` fica null. Como null é o que dispara a promo e o modal
  // de lançamento, sem isto o assinante seria convidado a comprar um módulo
  // que ele já tem.
  const brindoletaStatus = (await brindoletaLiberada(supabase, barbearia.id))
    ? 'active'
    : ((brindoletaLicenseRaw?.status ?? null) as BrindoletaStatus | null)

  // Popup de oferta: quem JÁ TEM a Brindoleta nunca vê. A pergunta é respondida
  // pelo banco (brindoleta_popup_deve_aparecer), que usa a mesma régua de acesso
  // do módulo e ainda respeita o adiamento e o "não tenho interesse".
  const popupBrindoleta = await decidirPopupBrindoleta(supabase, BRINDOLETA_PRICE_LABEL)

  // Avisos de venda + contador de pendentes — só pro admin (dono da plataforma).
  const brindoletaAdmin = emailEhAdminCortesia(user.email)
  let brindoletaVendas: { id: string; empresa: string; valorCents: number; quando: string | null }[] = []
  if (brindoletaAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb: any = createAdminClient()
    const { data: pend } = await adminDb
      .from('brindoleta_licenses')
      .select('barbearia_id, amount_cents, requested_at')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(20)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = (pend ?? []).map((p: any) => p.barbearia_id)
    const { data: barbs } = ids.length
      ? await adminDb.from('barbearias').select('id, nome').in('id', ids)
      : { data: [] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    brindoletaVendas = (pend ?? []).map((p: any) => ({
      id: p.barbearia_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      empresa: (barbs ?? []).find((b: any) => b.id === p.barbearia_id)?.nome ?? 'Empresa',
      valorCents: p.amount_cents ?? 4700,
      quando: p.requested_at ?? null,
    }))
  }

  // Aviso de assinatura (vitalício nunca gera aviso — a função sai antes).
  const acessoAssinatura = await verificarAssinatura()

  // Destaques do mês (privado do dono, sempre do CICLO ATUAL — independe do
  // mês navegado). Mesma fonte do ranking; só leitura.
  const destaques = await calcularDestaquesMes(supabase, barbearia.id)

  const hoje = hojeBrasil()
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
  const { diasUteisCorridos, diasUteisRestantes, diasTotaisCiclo, diasRestantesCiclo } =
    ehPeriodoAtual
      ? calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, hoje)
      // Mês fechado/futuro: usa as datas-limite como se "hoje" fosse o fim do ciclo
      : calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, ciclo.fim)
  const diasRestantes = diasRestantesCiclo
  // Andamento do ciclo em dias corridos — base do ritmo por dias de trabalho.
  const diasCorridosCiclo = diasTotaisCiclo - diasRestantesCiclo

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

  // Barbeiros ativos + lançamentos do ciclo + meta de cada um. Mesma função
  // que a folha do Financeiro usa, pra os dois partirem da mesma base.
  const { barbeiros, lancamentos, ranking } = await carregarBaseDoCiclo(
    supabase, barbearia.id, mes, ano, metasIndividuais,
  )

  const totalComissoes = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const faturamentoReal = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalComissoes
  // % calculado a partir do faturamento real — preservado mesmo quando
  // o R$ é ocultado, pra alimentar o anel/barra de progresso da UI.
  const progressoColetivo = meta ? calcProgresso(faturamentoReal, meta.meta_coletiva) : 0
  const progressoColetivoBronze = meta?.meta_coletiva_bronze
    ? calcProgresso(faturamentoReal, meta.meta_coletiva_bronze) : 0
  const progressoColetivoPrata = meta?.meta_coletiva_prata
    ? calcProgresso(faturamentoReal, meta.meta_coletiva_prata) : 0
  // Quando o dono desliga "Mostrar faturamento geral", zera o valor que vai
  // pro client — UI/cards/anel ficam só com %.
  const faturamentoExibido = mostrarFaturamentoGeral ? faturamentoReal : 0

  const rankingBarbeiros = ranking.filter(b => b.tipo !== 'recepcionista')
  const rankingRecepcionistas = ranking.filter(b => b.tipo === 'recepcionista')

  // Recepcionistas participam só das pontuações (campanha), não das metas de
  // comissão — então ficam de fora da configuração de metas individuais.
  const barbeirosMetas = barbeiros.filter(b => b.tipo !== 'recepcionista')

  // ── Gamificação e premiação ───────────────────────────────────────────
  // Carregamento compartilhado com a folha do Financeiro: os dois precisam dos
  // MESMOS números, e dois carregamentos paralelos dariam totais parecidos e
  // divergentes. Ver lib/premios/servidor.
  const {
    modoAtual, campanha, pontosMap, pontosHojePorBarbeiro,
    rankingPontosBarb, rankingPontosRecep, premiacao,
  } = await carregarGamificacao(supabase, {
    barbeariaId: barbearia.id, mes, ano, ciclo, ehPeriodoAtual, hoje,
    barbeiros, ranking,
    // Só o dashboard copia a campanha do ciclo anterior quando falta.
    garantirCampanha: true,
  })

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

  // ── Comparativo com o MESMO PONTO do ciclo anterior ──────────────────────
  // O bloco antigo comparava o ciclo em andamento com o mês passado INTEIRO —
  // no dia 8 a barbearia "perdia" de um mês de 31 dias que já acabou. Aqui a
  // fatia é a mesma régua já validada na reunião e nos destaques
  // (lib/mesmoPeriodo.ts), e o resultado alimenta tanto a seção nova quanto o
  // card "Comparativo" que já existia.
  const anteriorCheioPorBarbeiro: Record<string, number> = {}
  for (const id of idsParaHistorico) {
    const h = historicoPorBarbeiro[id] ?? []
    anteriorCheioPorBarbeiro[id] = h[h.length - 2]?.comissao ?? 0
  }
  const atualPorBarbeiro: Record<string, number> = {}
  for (const r of ranking) atualPorBarbeiro[r.id] = r.comissao

  const comparativoReal = await montarComparativoPeriodo(supabase, {
    barbeariaId: barbearia.id,
    ciclo,
    diaFechamento,
    hoje,
    ehPeriodoAtual,
    barbeiroIds: idsParaHistorico,
    totalAtual: faturamentoReal,
    totalAnteriorCheio: faturamentoMesAnteriorReal,
    atualPorBarbeiro,
    anteriorCheioPorBarbeiro,
  })

  // Mesmo critério do resto da tela: com "Mostrar faturamento geral" desligado,
  // o R$ da casa não sai do servidor — não basta esconder na UI, porque a série
  // viajaria inteira no HTML. O individual não é afetado pelo toggle.
  const comparativo = mostrarFaturamentoGeral
    ? comparativoReal
    : {
        ...comparativoReal,
        coletivo: { atual: 0, anterior: 0, serieAtual: [], serieAnterior: [], medido: false },
      }

  // LEMBRETE DE CADASTRAR A META DO CICLO VIGENTE.
  // Decidido no servidor: quando a meta já existe (ou não é hora de perguntar),
  // o componente nem chega ao navegador. O ciclo é sempre o corrente, mesmo
  // que o dono esteja navegando um mês passado — olhar agosto não muda o fato
  // de setembro estar sem meta.
  const lembreteMeta = await montarLembreteMeta(supabase, barbearia.id, user.id, diaFechamento)

  return (
    <>
    <DashboardShell
      premiacao={premiacao}
      mostrarCortesias={emailEhAdminCortesia(user.email)}
      brindoletaStatus={brindoletaStatus}
      // Dois popups na mesma carga é um a mais. O lembrete de meta é do
      // negócio do dono e tem prazo (o mês corrente); a oferta pode esperar
      // a próxima visita.
      popupBrindoleta={lembreteMeta ? null : popupBrindoleta}
      brindoletaAdmin={brindoletaAdmin}
      brindoletaVendas={brindoletaVendas}
      barbeariaNome={barbearia.nome}
      cicloLabel={ciclo.label}
      isAutonomo={isAutonomo}
      comissaoMesAnterior={comissaoMesAnterior}
      historicoMeses={historicoMeses}
      historicoPorBarbeiro={historicoPorBarbeiro}
      historicoBarbearia={historicoBarbeariaExibido}
      faturamentoMesAnterior={faturamentoMesAnterior}
      comparativo={comparativo}
      mostrarFaturamentoGeral={mostrarFaturamentoGeral}
      modoMeta={barbearia.modo_meta ?? 'comissao'}
      baseMeta={barbearia.base_meta ?? 'comissao'}
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
      avisoAssinaturaSlot={<AvisoAssinatura acesso={acessoAssinatura} />}
      destaquesSlot={<DestaquesMes destaques={destaques} />}
      mes={mes}
      ano={ano}
      meta={meta}
      faturamentoExibido={faturamentoExibido}
      progressoColetivo={progressoColetivo}
      progressoColetivoBronze={progressoColetivoBronze}
      progressoColetivoPrata={progressoColetivoPrata}
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
      diasTrabalhoPadrao={barbearia.dias_trabalho_padrao ?? null}
      diasCorridosCiclo={diasCorridosCiclo}
      totalDiasCiclo={diasTotaisCiclo}
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
          modoMeta={barbearia.modo_meta ?? 'comissao'}
          baseMeta={barbearia.base_meta ?? 'comissao'}
          mes={mes}
          ano={ano}
          herdadoDeMesAnterior={herdadoDeMesAnterior}
          diaFechamento={diaFechamento}
        />
      ) : null}
      campanhaSlot={modoAtual !== 'metas' && !mesFechado ? (
        <CampanhaModal campanha={campanha} mes={mes} ano={ano} regrasGeraisDb={barbearia.regras_gerais ?? null} />
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
    {lembreteMeta && <LembreteMetaModal lembrete={lembreteMeta} />}
    </>
  )
}
