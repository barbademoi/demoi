'use client'

import { useState, useMemo, useTransition } from 'react'
import { formatBRL, TIER_CONFIG, calcProgresso } from '@/lib/utils'
import { calcularRitmo } from '@/lib/ritmo'
import { marcarOcorrenciaCiente, enviarMensagemBarbeiro, marcarMensagemLidaBarbeiro } from './conduta-actions'
import DiasEmAbertoAlerta from './DiasEmAbertoAlerta'
import BarbeiroNavDrawer, { type NavItem } from './NavBarbeiro'
import { pegarRegrasGerais } from '@/lib/regras'
import LancarDiaForm from './LancarDiaForm'
import CelebracaoOverlay from '@/components/barbeiro/CelebracaoOverlay'
import ComparativoMesAnterior from '@/components/autonomo/ComparativoMesAnterior'
import HistoricoMeses from '@/components/autonomo/HistoricoMeses'
import TicketMedio from '@/components/autonomo/TicketMedio'
import type {
  Barbeiro, MetaIndividual, Lancamento,
  CampanhaComDetalhes, ControleDiario, ModoPontos,
} from '@/types/database'

type LancamentoComNome = Lancamento & { barbeiros: { nome: string } | null }

function fmtDataCurta(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
function fmtDataHoraBR(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface PontosEntry { barbeiro_id: string; pontos: number }

interface Props {
  barbeiro: Barbeiro
  barbeariaName: string
  mes: number
  ano: number
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  // Base "dias de trabalho" (null → usa dias úteis, comportamento legado)
  diasTrabalhoMes: number | null
  diasCorridosCiclo: number
  totalDiasCiclo: number
  modo: ModoPontos
  // metas
  metaInd: MetaIndividual | null
  lancamento: Lancamento | null
  progresso: { bronze: number; prata: number; ouro: number; tier_atual: import('@/types/database').Tier | null } | null
  ranking: LancamentoComNome[]
  posicaoRanking: number
  faturamentoColetivo: number
  progressoColetivo: number
  progressoColetivoBronze: number
  progressoColetivoPrata: number
  metaColetiva: number
  metaColetivaBronze: number
  metaColetivaPrata: number
  premioColetivo: string | null
  premioColetivoBronze: string | null
  premioColetivoPrata: string | null
  insights: { emoji: string; texto: string; destaque?: boolean }[]
  mensagemIA: string | null
  tiersJaCelebrados: string[]
  // pontos
  campanha: CampanhaComDetalhes | null
  controlesDiario: ControleDiario[]
  pontosTotal: number
  rankingPontos: PontosEntry[]
  // Barbeiros ativos (nao-recepcionistas) usados como fallback pra achar nome
  // no ranking de pontos quando o barbeiro nao tem lancamento em `ranking`.
  barbeirosAtivos: Array<{ id: string; nome: string }>
  pontosMap: Record<string, number>
  controleHoje: Record<string, number>
  historico: { data: string; pontos: number; label: string }[]
  visibilidadeRanking: 'completo' | 'posicoes' | 'proprio'
  isAutonomo: boolean
  comissaoMesAnterior: number
  historicoMeses: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  cicloLabel: string
  diaFechamento: number
  mostrarTicketMedio: boolean
  mostrarFaturamentoGeral: boolean
  feedbacksDoBarbeiro: Array<{
    id: string
    estrelas: number
    comentario: string | null
    nome_cliente: string | null
    data: string
    created_at: string
    codigo_resgate: string | null
    brinde_usado: boolean
    brindes: { nome: string } | null
  }>
  // Regras gerais editadas pela barbearia (null = usa default).
  regrasGerais: string[] | null
  // ── Conduta privada (módulo comportamento) — só do próprio barbeiro ──
  comportamentoAtivo: boolean
  ocorrenciasConduta: Array<{
    id: string
    descricao: string | null
    valor: number
    observacao: string | null
    data: string
    cienteEm: string | null
  }>
  saldoConduta: number
  mensagensConduta: Array<{
    id: string
    threadId: string
    autor: 'barbeiro' | 'dono'
    anonima: boolean
    corpo: string
    lidaEm: string | null
    createdAt: string
  }>
  // Dias do ciclo atual sem lançamento / marcados como "não pontuei"
  diasEmAberto: string[]
  diasMarcados: string[]
}

export default function BarbeiroClient({
  barbeiro, barbeariaName: _, mes, ano, diaAtual, diasRestantes, diasUteisCorridos, diasUteisRestantes,
  diasTrabalhoMes, diasCorridosCiclo, totalDiasCiclo,
  modo, metaInd, lancamento, progresso, ranking, posicaoRanking,
  faturamentoColetivo, progressoColetivo, progressoColetivoBronze, progressoColetivoPrata,
  metaColetiva, metaColetivaBronze, metaColetivaPrata,
  premioColetivo, premioColetivoBronze, premioColetivoPrata,
  insights, mensagemIA, tiersJaCelebrados, campanha, controlesDiario,
  pontosTotal, rankingPontos, barbeirosAtivos, pontosMap, controleHoje, historico,
  visibilidadeRanking, isAutonomo, comissaoMesAnterior, historicoMeses,
  cicloLabel, diaFechamento, mostrarTicketMedio, mostrarFaturamentoGeral,
  feedbacksDoBarbeiro,
  regrasGerais,
  comportamentoAtivo,
  ocorrenciasConduta,
  saldoConduta,
  mensagensConduta,
  diasEmAberto,
  diasMarcados,
}: Props) {
  const comissao = lancamento?.comissao_acumulada ?? 0
  // Recepcionista participa só das pontuações — esconde tudo de comissão/metas.
  const isRecepcionista = barbeiro.tipo === 'recepcionista'
  const mostraPontos = modo === 'pontos' || modo === 'ambos'
  const mostraMetas = (modo === 'metas' || modo === 'ambos') && !isRecepcionista
  // Modo "dono lança": esconde a aba/form de lançar (barbeiro continua
  // vendo progresso, ranking, regras e feedbacks). Bloqueio tambem aplicado
  // no servidor em lancarDiaBarbeiro.
  const barbeiroPodeLancar = campanha?.quem_lanca !== 'dono'
  type AbaId = 'progresso' | 'lancar' | 'regras' | 'feedbacks' | 'acompanhamento'
  const [aba, setAba] = useState<AbaId>('progresso')
  const [menuAberto, setMenuAberto] = useState(false)
  const temFeedbacks = feedbacksDoBarbeiro.length > 0
  // Conduta: alerta enquanto houver ocorrência não vista (ciente_em null).
  // `ackedIds` dá o feedback otimista da ciência antes do refresh do server.
  const [ackedIds, setAckedIds] = useState<Set<string>>(() => new Set<string>())
  const [condutaPending, startCondutaTransition] = useTransition()
  const isVista = (o: { id: string; cienteEm: string | null }) => !!o.cienteEm || ackedIds.has(o.id)
  function handleCiente(id: string) {
    setAckedIds(prev => new Set(prev).add(id))
    startCondutaTransition(async () => { await marcarOcorrenciaCiente(barbeiro.link_codigo, id) })
  }

  // Mensagens: envio (identificada/anônima) + check de leitura das respostas do dono.
  const [msgTexto, setMsgTexto] = useState('')
  const [msgAnonima, setMsgAnonima] = useState(false)
  const [msgLidasLocal, setMsgLidasLocal] = useState<Set<string>>(() => new Set<string>())
  const msgFoiLida = (m: { id: string; lidaEm: string | null }) => !!m.lidaEm || msgLidasLocal.has(m.id)
  // Ordena por data pra virar uma conversa (as anônimas do próprio barbeiro entram como enviadas).
  const mensagensOrdenadas = useMemo(
    () => mensagensConduta.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [mensagensConduta],
  )
  const respostasNaoLidas = comportamentoAtivo ? mensagensConduta.filter(m => m.autor === 'dono' && !msgFoiLida(m)).length : 0
  // Thread identificada aberta (pra continuar a conversa, se houver).
  const threadIdentificada = mensagensConduta.find(m => !m.anonima)?.threadId

  const novasOcorrenciasConduta = comportamentoAtivo ? ocorrenciasConduta.filter(o => !isVista(o)).length : 0
  const condutaNaoVistas = comportamentoAtivo
    ? novasOcorrenciasConduta + respostasNaoLidas
    : 0

  // Modelo único de navegação — abas (desktop) e drawer (mobile) usam a mesma
  // lista. "Progresso" volta pra visão principal (funciona também em modo metas).
  const navItens: NavItem[] = [
    ...(mostraPontos || temFeedbacks || comportamentoAtivo ? [{ id: 'progresso', label: 'Progresso' }] : []),
    ...(mostraPontos && barbeiroPodeLancar ? [{ id: 'lancar', label: 'Lançar dia' }] : []),
    ...(mostraPontos && campanha ? [{ id: 'regras', label: 'Regras' }] : []),
    ...(temFeedbacks ? [{ id: 'feedbacks', label: `Feedbacks (${feedbacksDoBarbeiro.length})` }] : []),
    ...(comportamentoAtivo ? [{ id: 'acompanhamento', label: 'Meu acompanhamento', badge: condutaNaoVistas }] : []),
  ]
  const mostrarNav = navItens.length > 1
  const temLancarRapido = mostraPontos && barbeiroPodeLancar
  const labelAtual = navItens.find(i => i.id === aba)?.label ?? 'Progresso'

  function handleEnviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    const corpo = msgTexto.trim()
    if (!corpo) return
    startCondutaTransition(async () => {
      const r = await enviarMensagemBarbeiro({
        linkCodigo: barbeiro.link_codigo,
        corpo,
        anonima: msgAnonima,
        threadId: msgAnonima ? undefined : threadIdentificada,
      })
      if (!r?.error) { setMsgTexto(''); setMsgAnonima(false) }
    })
  }
  function handleLerResposta(id: string) {
    setMsgLidasLocal(prev => new Set(prev).add(id))
    startCondutaTransition(async () => { await marcarMensagemLidaBarbeiro(barbeiro.link_codigo, id) })
  }

  const [celebracaoFechada, setCelebracaoFechada] = useState(false)

  const posicaoPts = rankingPontos.findIndex(r => r.barbeiro_id === barbeiro.id)
  const minPontosEfetivo = campanha
    ? (barbeiro.tipo === 'recepcionista' ? campanha.min_pontos_recep : campanha.min_pontos)
    : 0
  const qualificado = campanha ? pontosTotal >= minPontosEfetivo : false
  const premioAtual = campanha?.campanha_premios.find(p => p.posicao === posicaoPts + 1)

  // Contagem de assinaturas para bônus.
  // Antes usava heurística por nome (`s.nome.includes('assinatura')`), que
  // travava o contador em 0 quando o item se chamava 'Plano clube',
  // 'Sócio mensal' etc. Agora soma os controles de TODOS os itens da
  // campanha marcados como `conta_como_assinatura` (flag explícita
  // marcada pelo dono em Configurações → Campanha).
  //
  // Fonte de dados: `controlesDiario` (mesma do "Ver lançamentos") já
  // filtra por barbeiro + janela do ciclo (data BRT, sem UTC).
  // Retroativo: ao marcar a flag, o contador já reflete o histórico do
  // ciclo sem precisar relançar nada.
  const idsAssinatura = new Set(
    (campanha?.campanha_servicos ?? [])
      .filter(s => s.conta_como_assinatura)
      .map(s => s.id),
  )
  const totalAssinaturas = idsAssinatura.size > 0
    ? (controlesDiario ?? [])
        .filter(cd => idsAssinatura.has(cd.servico_id))
        .reduce((s, cd) => s + cd.quantidade, 0)
    : 0
  const temBonus = campanha && totalAssinaturas >= campanha.bonus_assin_qtd

  // ── Celebração (2B) ────────────────────────────────────
  const tierAtual = progresso?.tier_atual ?? null
  const deveComemorar = (
    !celebracaoFechada &&
    tierAtual !== null &&
    mostraMetas &&
    !tiersJaCelebrados.includes(tierAtual)
  )
  const premioParaCelebrar = tierAtual
    ? (metaInd?.[`${tierAtual}_premio` as 'bronze_premio' | 'prata_premio' | 'ouro_premio'] ?? null)
    : null

  // ── Contagem regressiva (2C) ─────────────────────────
  const diasNoMes = new Date(ano, mes, 0).getDate()

  let tierId: 'bronze' | 'prata' | 'ouro' | null = null
  let metaFoco = 0
  if (metaInd) {
    if (comissao < metaInd.bronze_comm) { tierId = 'bronze'; metaFoco = metaInd.bronze_comm }
    else if (comissao < metaInd.prata_comm) { tierId = 'prata'; metaFoco = metaInd.prata_comm }
    else if (comissao < metaInd.ouro_comm) { tierId = 'ouro'; metaFoco = metaInd.ouro_comm }
  }

  // Ritmo/projetado com base nos DIAS DE TRABALHO do barbeiro (ou dias úteis
  // do ciclo, se não configurado). A meta total em R$ não muda — só a base.
  const ritmo = calcularRitmo({
    comissao,
    metaFoco,
    diasCorridosCiclo,
    totalDiasCiclo,
    diasTrabalhoMes,
    diasUteisCorridos,
    diasUteisRestantes,
  })
  const ritmoAtual = ritmo.ritmoAtual
  const valorNecessarioPorDia = ritmo.necessarioPorDia
  const ritmoOk = ritmo.ritmoOk
  const usaDiasTrabalho = ritmo.usaDiasTrabalho
  const unidadeDia = usaDiasTrabalho ? 'dia de trabalho' : 'dia útil'
  const diasBaseRestantes = Math.round(ritmo.baseRestantes)
  const mostrarContagem = mostraMetas && metaInd !== null && ritmo.baseRestantes > 0 && diasNoMes > 0

  return (
    <>
      {/* Celebração fullscreen */}
      {deveComemorar && tierAtual && (
        <CelebracaoOverlay
          barbeiro_id={barbeiro.id}
          nome={barbeiro.nome}
          tier={tierAtual}
          premio={premioParaCelebrar}
          mes={mes}
          ano={ano}
          onClose={() => setCelebracaoFechada(true)}
        />
      )}

      {/* Alerta de dias sem lançamento (retroativo + "não pontuei") — topo */}
      {(diasEmAberto.length > 0 || diasMarcados.length > 0) && (
        <div className="mb-4">
          <DiasEmAbertoAlerta
            linkCodigo={barbeiro.link_codigo}
            diasEmAberto={diasEmAberto}
            diasMarcados={diasMarcados}
            servicos={campanha?.campanha_servicos ?? []}
          />
        </div>
      )}

      {/* Novidade no "Meu acompanhamento" — registro/pontos ou mensagem do dono.
          Destaca no topo (mesmo estilo dos dias em aberto). Some ao ficar em dia
          ou quando já está na aba. */}
      {comportamentoAtivo && condutaNaoVistas > 0 && aba !== 'acompanhamento' && (
        <div className="mb-4">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 font-sans font-semibold text-sm">
                🔔 Você tem {condutaNaoVistas} {condutaNaoVistas === 1 ? 'novidade' : 'novidades'} no Meu acompanhamento
              </p>
              <p className="text-amber-200/80 text-xs font-sans mt-0.5 leading-relaxed">
                {[
                  novasOcorrenciasConduta > 0
                    ? `${novasOcorrenciasConduta} ${novasOcorrenciasConduta === 1 ? 'registro novo' : 'registros novos'}`
                    : null,
                  respostasNaoLidas > 0
                    ? `${respostasNaoLidas} ${respostasNaoLidas === 1 ? 'mensagem do dono' : 'mensagens do dono'}`
                    : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button
              onClick={() => setAba('acompanhamento')}
              className="text-xs font-sans font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              Ver
            </button>
          </div>
        </div>
      )}

      {/* Navegação entre seções. DESKTOP = abas (cabe); MOBILE = botão Menu que
          abre um drawer lateral (resolve texto cortado / abas escondidas). */}
      {mostrarNav && (
        <>
          {/* Desktop: abas horizontais (comportamento atual) */}
          <div className="hidden lg:flex border-b border-border mb-0 overflow-x-auto">
            {navItens.map(it => (
              <button
                key={it.id}
                onClick={() => setAba(it.id as AbaId)}
                aria-current={aba === it.id ? 'page' : undefined}
                className={`flex-1 py-3.5 px-3 text-sm font-sans font-semibold transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5
                  ${aba === it.id ? 'text-text border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
              >
                {it.label}
                {it.badge != null && it.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {it.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile: botão Menu + acesso rápido a "Lançar dia" */}
          <div className="lg:hidden flex items-center gap-2 border-b border-border pb-3 mb-1">
            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu de navegação"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-border text-text font-sans font-semibold text-sm shrink-0"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Menu
            </button>
            <span className="flex-1 min-w-0 text-text-muted text-sm font-sans truncate">{labelAtual}</span>
            {temLancarRapido && (
              <button
                onClick={() => setAba('lancar')}
                className="btn-primary text-sm py-2 px-3 shrink-0"
              >
                Lançar dia
              </button>
            )}
          </div>
        </>
      )}

      {/* Drawer mobile */}
      <BarbeiroNavDrawer
        open={menuAberto}
        onClose={() => setMenuAberto(false)}
        itens={navItens}
        ativo={aba}
        onSelecionar={(id) => setAba(id as AbaId)}
      />

      {/* ── ABA: PROGRESSO ── (default; ativa quando mostraPontos=false
          tirando o caso em que o usuário clicou em feedbacks/acompanhamento) */}
      {(aba === 'progresso' || (!mostraPontos && aba !== 'feedbacks' && aba !== 'acompanhamento')) && (
        <div className="space-y-6 pt-2">

          {/* Card do barbeiro */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-3xl text-text-muted mx-auto mb-3 overflow-hidden">
              {barbeiro.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
              ) : barbeiro.nome[0]}
            </div>
            <h2 className="font-serif text-3xl text-text">{barbeiro.nome}</h2>
            <p className="text-text-muted text-sm font-sans mt-1">{cicloLabel}</p>

            {mostraMetas && (
              <div className="mt-6">
                <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">Comissão acumulada</p>
                <p className="font-serif text-5xl text-text">{formatBRL(comissao)}</p>
              </div>
            )}

            {progresso?.tier_atual && mostraMetas && (
              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border
                ${progresso.tier_atual === 'ouro'  ? 'border-yellow-500/30 bg-yellow-500/5' :
                  progresso.tier_atual === 'prata' ? 'border-gray-400/30 bg-gray-400/5' :
                  'border-amber-700/30 bg-amber-700/5'}`}>
                <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[progresso.tier_atual].textClass}`}>
                  ★ {TIER_CONFIG[progresso.tier_atual].label} atingido!
                </span>
              </div>
            )}
          </div>

          {/* Mensagem IA (2A) */}
          {mensagemIA && mostraMetas && (
            <div className="card-light px-5 py-4">
              <p className="text-on-cream-muted text-xs font-sans uppercase tracking-wide mb-2">Mensagem do dia</p>
              <p className="font-sans text-sm text-on-cream leading-relaxed">{mensagemIA}</p>
            </div>
          )}

          {/* Comparativo mês anterior (qualquer modalidade, modo metas) */}
          {mostraMetas && (
            <ComparativoMesAnterior
              comissaoAtual={comissao}
              comissaoMesAnterior={comissaoMesAnterior}
              mesAtual={mes}
              variant="light"
              labelPeriodoAnterior={historicoMeses[historicoMeses.length - 2]?.label}
              labelPeriodoAtual={`Esse ${diaFechamento === 1 ? 'mês' : 'ciclo'} até agora`}
            />
          )}

          {/* Histórico 4 meses (qualquer modalidade, modo metas) */}
          {mostraMetas && historicoMeses.length > 0 && (
            <HistoricoMeses historico={historicoMeses} variant="light" />
          )}

          {/* Ticket médio (qualquer modalidade, modo metas) — só se o dono ativou */}
          {mostraMetas && mostrarTicketMedio && historicoMeses.length > 0 && (
            <TicketMedio historico={historicoMeses} variant="light" />
          )}

          {/* Contagem regressiva (2C) */}
          {mostrarContagem && (
            <div className="card-light p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-on-cream-muted text-xs font-sans uppercase tracking-wide">
                  Faltam {diasBaseRestantes} {diasBaseRestantes === 1 ? unidadeDia : `${unidadeDia}s`}
                </p>
                {tierId && (
                  <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tierId].textClass}`}>
                    Foco: {TIER_CONFIG[tierId].label}
                  </span>
                )}
              </div>

              {tierId && valorNecessarioPorDia > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-on-cream-muted text-xs font-sans">Necessário/{unidadeDia} para {TIER_CONFIG[tierId].label}</p>
                      <p className="font-serif text-2xl text-on-cream">{formatBRL(valorNecessarioPorDia)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-on-cream-muted text-xs font-sans">Seu ritmo atual</p>
                      <p className={`font-serif text-2xl ${ritmoOk ? 'text-green-600' : 'text-amber-500'}`}>
                        {formatBRL(ritmoAtual)}
                      </p>
                    </div>
                  </div>
                  {/* Projeção de fechamento — extrapola o ritmo atual sobre a base
                      de dias. Usa dias de trabalho quando configurado. */}
                  <div className="flex items-center justify-between pt-1 border-t border-on-cream/10">
                    <p className="text-on-cream-muted text-xs font-sans">
                      Projeção de fechamento
                      {usaDiasTrabalho ? ` (${ritmo.baseTotal} dias de trabalho)` : ''}
                    </p>
                    <p className="font-serif text-lg text-on-cream">{formatBRL(ritmo.projetado)}</p>
                  </div>
                  <div className={`text-xs font-sans px-3 py-2 rounded-xl ${
                    ritmoOk
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {ritmoOk
                      ? `✅ No ritmo certo para ${TIER_CONFIG[tierId].label}`
                      : `⚠️ Precisa de ${formatBRL(valorNecessarioPorDia - ritmoAtual)}/${unidadeDia} a mais`}
                  </div>
                </>
              ) : tierId === null ? (
                <p className="text-green-700 text-sm font-sans font-medium">✅ Todas as metas atingidas!</p>
              ) : (
                <p className="text-on-cream-muted text-xs font-sans">Meta impossível neste mês — foque no próximo.</p>
              )}
            </div>
          )}

          {/* Seção de pontos */}
          {mostraPontos && campanha && (
            <div className="card-light p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-on-cream">Pontuação do mês</h3>
                {posicaoPts >= 0 && qualificado && !isAutonomo && (
                  <span className="text-on-cream-muted text-sm font-sans">
                    #{posicaoPts + 1} no ranking
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="flex items-end gap-3">
                <p className="font-serif text-5xl text-on-cream">{pontosTotal}</p>
                <p className="text-on-cream-muted text-lg font-sans mb-1">pts</p>
              </div>

              {/* Barra até mínimo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-on-cream-muted text-xs font-sans">
                    {qualificado
                      ? (isAutonomo ? '✓ Pontuação mínima atingida' : '✓ Qualificado para o ranking')
                      : `Faltam ${minPontosEfetivo - pontosTotal} pts ${isAutonomo ? 'para o prêmio' : 'para qualificar'}`}
                  </span>
                  <span className="text-on-cream-muted text-xs font-sans">{minPontosEfetivo} pts</span>
                </div>
                <div className="bar-track h-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${qualificado ? 'bar-gold' : 'bar-bronze'}`}
                    style={{ width: `${Math.min(100, Math.round((pontosTotal / minPontosEfetivo) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Prêmio estimado */}
              {qualificado && premioAtual && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-primary text-sm font-sans font-semibold">Prêmio estimado</p>
                    <p className="font-serif text-2xl text-on-cream">{formatBRL(Number(premioAtual.valor))}</p>
                  </div>
                </div>
              )}

              {/* Alerta abaixo do mínimo */}
              {!qualificado && pontosTotal > 0 && (
                <p className="text-on-cream-muted text-xs font-sans text-center opacity-70">
                  ⚡ Continue lançando seus serviços para {isAutonomo ? 'atingir a meta' : 'entrar no ranking'}!
                </p>
              )}

              {/* Bônus assinaturas */}
              {campanha.bonus_assin_qtd > 0 && (
                <div className={`rounded-xl px-4 py-3 text-xs font-sans
                  ${temBonus ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : 'bg-cream-surface text-on-cream-muted'}`}>
                  {temBonus
                    ? `⭐ Bônus de assinaturas desbloqueado! +${formatBRL(Number(campanha.bonus_assin_valor))}`
                    : `${totalAssinaturas}/${campanha.bonus_assin_qtd} assinaturas para bônus de ${formatBRL(Number(campanha.bonus_assin_valor))}`
                  }
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && mostraMetas && (
            <div className="card-light p-5 space-y-3">
              <p className="text-on-cream-muted text-xs font-sans uppercase tracking-wide">Insights do mês</p>
              {insights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ins.destaque === true ? 'bg-primary/10 border border-primary/20' : 'bg-cream-surface'}`}>
                  <span className="text-xl shrink-0">{ins.emoji}</span>
                  <p className={`font-sans text-sm ${ins.destaque === true ? 'text-on-cream font-medium' : 'text-on-cream-muted'}`}>{ins.texto}</p>
                </div>
              ))}
            </div>
          )}

          {/* Barras Bronze / Prata / Ouro */}
          {metaInd && progresso && mostraMetas && (
            <div className="card-light p-6 space-y-5">
              <h3 className="font-serif text-lg text-on-cream">Suas metas</h3>
              {(['bronze', 'prata', 'ouro'] as const).map((tier) => {
                const metaVal = metaInd[`${tier}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm']
                const premio  = metaInd[`${tier}_premio` as 'bronze_premio' | 'prata_premio' | 'ouro_premio']
                if (!metaVal || metaVal <= 0) return null
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                        {TIER_CONFIG[tier].label}
                        {premio && <span className="text-on-cream-muted font-normal ml-2">· {premio}</span>}
                      </span>
                      <span className="text-on-cream-muted text-xs font-sans">
                        {formatBRL(comissao)} / {formatBRL(metaVal)}
                      </span>
                    </div>
                    <div className="bar-track h-2.5">
                      <div
                        className={`${TIER_CONFIG[tier].barClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: progresso[tier] > 0 ? `${progresso[tier]}%` : '3px' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-on-cream-muted text-xs font-sans">{progresso[tier]}%</span>
                      {comissao < metaVal && (
                        <span className="text-on-cream-muted text-xs font-sans">faltam {formatBRL(metaVal - comissao)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Ranking pontos da equipe — dividido em dois blocos visuais:
              1) QUALIFICADOS: atingiram min_pontos, mostram posição + prêmio em jogo
              2) ABAIXO DO MÍNIMO: ordenados por proximidade (maior pontos primeiro)
              Visibilidade:
                - 'proprio'   → bloco inteiro escondido
                - 'posicoes'  → mostra nome + posição, mas esconde pontos/"falta" dos outros
                - 'completo'  → mostra tudo */}
          {mostraPontos && rankingPontos.length > 0 && visibilidadeRanking !== 'proprio' && !isAutonomo && campanha && (() => {
            const min = campanha.min_pontos
            const qualificados = rankingPontos.filter(r => r.pontos >= min)
            // Quem não qualificou: mais perto do mínimo primeiro (= maior pontos primeiro).
            // rankingPontos já vem ordenado desc, então o filter preserva isso.
            const abaixoMin = rankingPontos.filter(r => r.pontos < min)
            const mostraValores = visibilidadeRanking === 'completo'
            return (
              <>
                {/* BLOCO 1 — QUALIFICADOS */}
                {qualificados.length > 0 && (
                  <div className="card-light p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-lg text-on-cream">🏆 Ranking — Qualificados</h3>
                      {posicaoPts >= 0 && qualificado && (
                        <span className="text-on-cream-muted text-sm font-sans">
                          Você em <span className="text-on-cream font-semibold">#{posicaoPts + 1}</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {qualificados.map((r, i) => {
                        const isMe = r.barbeiro_id === barbeiro.id
                        const b = ranking.find(l => l.barbeiro_id === r.barbeiro_id)
                        const nome = b?.barbeiros?.nome
                          ?? barbeirosAtivos.find(x => x.id === r.barbeiro_id)?.nome
                          ?? '—'
                        const premio = campanha.campanha_premios.find(p => p.posicao === i + 1)
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                        return (
                          <div key={r.barbeiro_id} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                            ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-cream-surface'}`}>
                            <span className={`font-sans text-sm w-8 text-center
                              ${i === 0 ? 'metal-text-gold' : i === 1 ? 'metal-text-silver' : i === 2 ? 'metal-text-bronze' : 'text-on-cream-muted'}`}>
                              {i + 1}º
                            </span>
                            <span className={`font-sans text-sm flex-1 truncate ${isMe ? 'text-on-cream font-semibold' : 'text-on-cream-muted'}`}>
                              {nome} {isMe && '(você)'}
                            </span>
                            {(mostraValores || isMe) && (
                              <span className={`font-sans text-sm tabular-nums ${isMe ? 'text-on-cream' : 'text-on-cream-muted'}`}>
                                {r.pontos} pts
                              </span>
                            )}
                            {premio && (
                              <span className="font-sans text-xs text-on-cream-muted whitespace-nowrap">
                                {medal} {formatBRL(Number(premio.valor))}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* BLOCO 2 — ABAIXO DO MÍNIMO. Se ninguém qualificou ainda,
                    vira "Ranking de Pontuações" (mesma lista, só muda o header)
                    pra não dar impressão de que não tem ranking. */}
                {abaixoMin.length > 0 && (
                  <div className="card-light p-6">
                    <h3 className="font-serif text-lg text-on-cream mb-4">
                      {qualificados.length === 0
                        ? '🏆 Ranking de Pontuações'
                        : '⏳ Ainda em busca do mínimo'}
                    </h3>
                    <div className="space-y-2">
                      {abaixoMin.map(r => {
                        const isMe = r.barbeiro_id === barbeiro.id
                        const b = ranking.find(l => l.barbeiro_id === r.barbeiro_id)
                        const nome = b?.barbeiros?.nome
                          ?? barbeirosAtivos.find(x => x.id === r.barbeiro_id)?.nome
                          ?? '—'
                        const falta = min - r.pontos
                        return (
                          <div key={r.barbeiro_id} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                            ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-cream-surface'}`}>
                            <span className={`font-sans text-sm flex-1 truncate ${isMe ? 'text-on-cream font-semibold' : 'text-on-cream-muted'}`}>
                              {nome} {isMe && '(você)'}
                            </span>
                            {(mostraValores || isMe) && (
                              <>
                                <span className={`font-sans text-sm tabular-nums ${isMe ? 'text-on-cream' : 'text-on-cream-muted'}`}>
                                  {r.pontos} pts
                                </span>
                                <span className="font-sans text-xs text-on-cream-muted whitespace-nowrap">
                                  faltam {falta} pts
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          {/* Ranking comissão da equipe */}
          {mostraMetas && ranking.length > 0 && visibilidadeRanking !== 'proprio' && !isAutonomo && (
            <div className="card-light p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-on-cream">Ranking da equipe</h3>
                {posicaoRanking > 0 && (
                  <span className="text-on-cream-muted text-sm font-sans">
                    Você em <span className="text-on-cream font-semibold">#{posicaoRanking}</span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {ranking.map((l, i) => {
                  const isMe = l.barbeiro_id === barbeiro.id
                  return (
                    <div key={l.barbeiro_id} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                      ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-cream-surface'}`}>
                      <span className={`font-sans text-sm w-5 text-center
                        ${i === 0 ? 'metal-text-gold' : i === 1 ? 'metal-text-silver' : i === 2 ? 'metal-text-bronze' : 'text-on-cream-muted'}`}>
                        {i + 1}
                      </span>
                      <span className={`font-sans text-sm flex-1 ${isMe ? 'text-on-cream font-semibold' : 'text-on-cream-muted'}`}>
                        {l.barbeiros?.nome ?? '—'} {isMe && '(você)'}
                      </span>
                      {/* Valor só aparece em modo 'completo' OU pra própria linha do barbeiro */}
                      {(visibilidadeRanking === 'completo' || isMe) && (
                        <span className={`font-sans text-sm ${isMe ? 'text-on-cream' : 'text-on-cream-muted'}`}>
                          {formatBRL(l.comissao_acumulada)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Meta coletiva (oculta em modo autônomo) — 3 tiers: Bronze, Prata, Ouro */}
          {(metaColetivaBronze > 0 || metaColetivaPrata > 0 || metaColetiva > 0) && mostraMetas && !isAutonomo && (
            <div className="card-light p-6 space-y-5">
              <h3 className="font-serif text-lg text-on-cream">Meta coletiva</h3>
              {(['bronze', 'prata', 'ouro'] as const).map(tier => {
                const metaVal =
                  tier === 'bronze' ? metaColetivaBronze :
                  tier === 'prata'  ? metaColetivaPrata  :
                                      metaColetiva
                const premio =
                  tier === 'bronze' ? premioColetivoBronze :
                  tier === 'prata'  ? premioColetivoPrata  :
                                      premioColetivo
                if (!metaVal || metaVal <= 0) return null
                // Com faturamento geral OFF, o R$ vem 0 do server — usa o % pré-
                // calculado por tier (mantém barra + % funcionando sem vazar o R$).
                const pct = mostrarFaturamentoGeral
                  ? calcProgresso(faturamentoColetivo, metaVal)
                  : tier === 'bronze' ? progressoColetivoBronze
                  : tier === 'prata'  ? progressoColetivoPrata
                                       : progressoColetivo
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                        {TIER_CONFIG[tier].label}
                        {premio && <span className="text-on-cream-muted font-normal ml-2">· {premio}</span>}
                      </span>
                      {mostrarFaturamentoGeral && (
                        <span className="text-on-cream-muted text-xs font-sans">
                          {formatBRL(faturamentoColetivo)} / {formatBRL(metaVal)}
                        </span>
                      )}
                    </div>
                    <div className="bar-track h-2.5">
                      <div
                        className={`${TIER_CONFIG[tier].barClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: pct > 0 ? `${pct}%` : '3px' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-on-cream-muted text-xs font-sans">{pct}%</span>
                      {mostrarFaturamentoGeral && faturamentoColetivo < metaVal && (
                        <span className="text-on-cream-muted text-xs font-sans">
                          faltam {formatBRL(metaVal - faturamentoColetivo)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: LANÇAR DIA ── */}
      {aba === 'lancar' && mostraPontos && barbeiroPodeLancar && (
        <div className="pt-2">
          {campanha ? (
            <LancarDiaForm
              linkCodigo={barbeiro.link_codigo}
              servicos={campanha.campanha_servicos}
              controleHoje={controleHoje}
              historico={historico}
              minPontos={minPontosEfetivo}
            />
          ) : (
            <div className="card-light p-10 text-center space-y-3">
              <p className="text-4xl">⏳</p>
              <p className="font-serif text-lg text-on-cream">Campanha não configurada</p>
              <p className="text-on-cream-muted text-sm font-sans">
                O dono da barbearia ainda não configurou a campanha deste mês.<br />
                Aguarde e volte em breve!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: REGRAS ── */}
      {aba === 'regras' && mostraPontos && campanha && (
        <div className="space-y-6 pt-2">
          <div className="card p-6 space-y-4">
            <h3 className="font-serif text-lg text-text flex items-center gap-2">
              <span aria-hidden>📋</span> Regras do mês
            </h3>
            <ul className="space-y-3">
              {pegarRegrasGerais(regrasGerais).map((r, i) => (
                <li key={i} className="text-sm font-sans text-text flex items-start gap-2 leading-relaxed">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {campanha.regras_personalizadas && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2">
                  Combinados da barbearia
                </p>
                <p className="text-sm font-sans text-text leading-relaxed whitespace-pre-wrap">
                  {campanha.regras_personalizadas}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA: FEEDBACKS DE CLIENTES ──
          Lista TODOS os feedbacks (inclusive notas baixas e comentários
          ruins) onde esse barbeiro foi marcado como 'quem te atendeu'.
          Mostra estrelas, nome do cliente, comentário e data. */}
      {aba === 'feedbacks' && (
        <div className="space-y-3 pt-4">
          <div className="px-1">
            <h2 className="font-serif text-lg text-text">Feedbacks de Clientes</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              O que clientes que apontaram você como atendente disseram.
            </p>
          </div>
          {feedbacksDoBarbeiro.map(f => (
            <div key={f.id} className="card-light p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg leading-none">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < f.estrelas ? 'text-yellow-400' : 'text-on-cream-muted/40'}>★</span>
                  ))}
                </div>
                <p className="text-on-cream-muted text-[11px] font-sans whitespace-nowrap">
                  {new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {f.nome_cliente && (
                <p className="text-on-cream text-xs font-sans font-semibold">{f.nome_cliente}</p>
              )}
              {f.comentario ? (
                <p className="text-on-cream text-sm font-sans leading-relaxed whitespace-pre-line">
                  &ldquo;{f.comentario}&rdquo;
                </p>
              ) : (
                <p className="text-on-cream-muted text-xs font-sans italic">Sem comentário.</p>
              )}
              {f.brindes && (
                <div className={`mt-2 rounded-lg border p-2.5 ${f.brinde_usado
                  ? 'border-on-cream-muted/20 bg-on-cream-muted/5'
                  : 'border-primary/30 bg-primary/5'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">🎁</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-on-cream text-xs font-sans font-semibold">
                        {f.brindes.nome}
                      </p>
                      {f.codigo_resgate && (
                        <p className="text-on-cream-muted text-[11px] font-sans mt-0.5">
                          Código: <span className="font-mono tracking-wider">{f.codigo_resgate}</span>
                        </p>
                      )}
                      <p className={`text-[11px] font-sans mt-1 ${f.brinde_usado ? 'text-on-cream-muted' : 'text-primary'}`}>
                        {f.brinde_usado ? '✓ Já resgatado' : 'Oferece pro cliente no próximo atendimento'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ABA: MEU ACOMPANHAMENTO (conduta privada — só o próprio barbeiro) ── */}
      {aba === 'acompanhamento' && comportamentoAtivo && (
        <div className="space-y-4 pt-4">
          <div className="px-1">
            <h2 className="font-serif text-lg text-text">Meu acompanhamento</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
              Registro de conduta feito pelo dono. É só seu — nenhum colega vê.
              Não conta pra pontuação, meta ou ranking.
            </p>
          </div>

          {/* Saldo do período (informativo) */}
          <div className="card-light p-4 flex items-center justify-between">
            <div>
              <p className="text-on-cream-muted text-xs font-sans uppercase tracking-wide">Saldo do período</p>
              <p className="text-on-cream-muted text-[11px] font-sans">{cicloLabel}</p>
            </div>
            <span className={['font-serif text-3xl tabular-nums', saldoConduta < 0 ? 'text-red-500' : saldoConduta > 0 ? 'text-green-600' : 'text-on-cream-muted'].join(' ')}>
              {saldoConduta > 0 ? '+' : ''}{saldoConduta}
            </span>
          </div>

          {ocorrenciasConduta.length === 0 ? (
            <p className="text-text-muted text-sm font-sans px-1 py-2">Nenhum registro neste período.</p>
          ) : (
            <div className="space-y-2">
              {ocorrenciasConduta.map(o => {
                const vista = isVista(o)
                return (
                  <div key={o.id} className={['rounded-xl border p-4 space-y-2',
                    vista ? 'card-light border-cream-border' : 'border-amber-500/40 bg-amber-500/5'].join(' ')}>
                    <div className="flex items-center gap-3">
                      <span className={['text-xs font-sans tabular-nums w-10 shrink-0', vista ? 'text-on-cream-muted' : 'text-amber-600'].join(' ')}>
                        {fmtDataCurta(o.data)}
                      </span>
                      <p className={['flex-1 min-w-0 text-sm font-sans truncate', vista ? 'text-on-cream' : 'text-amber-800'].join(' ')}>
                        {o.descricao ?? '—'}
                      </p>
                      <span className={['font-serif text-lg tabular-nums shrink-0', o.valor < 0 ? 'text-red-500' : 'text-green-600'].join(' ')}>
                        {o.valor > 0 ? '+' : ''}{o.valor}
                      </span>
                    </div>
                    {o.observacao && (
                      <p className="text-sm font-sans text-on-cream leading-relaxed whitespace-pre-line pl-[3.25rem]">💬 {o.observacao}</p>
                    )}
                    <div className="pl-[3.25rem]">
                      {vista ? (
                        <p className="text-[11px] font-sans text-on-cream-muted">
                          {o.cienteEm ? `✓ Você deu ciência em ${fmtDataHoraBR(o.cienteEm)}` : '✓ Ciência registrada'}
                        </p>
                      ) : (
                        <button
                          onClick={() => handleCiente(o.id)}
                          disabled={condutaPending}
                          className="text-xs font-sans font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Li e estou ciente
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-text-muted text-[11px] font-sans px-1 leading-relaxed">
            &ldquo;Li e estou ciente&rdquo; significa que você viu o registro — não que concorda com ele.
          </p>

          {/* ── Recados pro dono ── */}
          <div className="pt-2 space-y-3">
            <div className="px-1">
              <h3 className="font-serif text-base text-text">Recados</h3>
              <p className="text-text-muted text-xs font-sans mt-0.5">Fale direto com o dono. Só vocês dois veem.</p>
            </div>

            {mensagensOrdenadas.length > 0 && (
              <div className="space-y-1.5">
                {mensagensOrdenadas.map(m => {
                  const meu = m.autor === 'barbeiro'
                  const donoNaoLida = m.autor === 'dono' && !msgFoiLida(m)
                  return (
                    <div key={m.id} className={['flex', meu ? 'justify-end' : 'justify-start'].join(' ')}>
                      <div className={['max-w-[85%] rounded-2xl px-3 py-2',
                        meu ? 'bg-primary/15 text-text' : donoNaoLida ? 'bg-amber-500/10 border border-amber-500/40 text-text' : 'card-light'].join(' ')}>
                        <p className={['text-sm font-sans whitespace-pre-line break-words', meu ? 'text-text' : 'text-on-cream'].join(' ')}>{m.corpo}</p>
                        <p className={['text-[10px] font-sans mt-0.5', meu ? 'text-text-muted' : 'text-on-cream-muted'].join(' ')}>
                          {meu ? (m.anonima ? 'Você (anônimo)' : 'Você') : 'Dono'} · {fmtDataHoraBR(m.createdAt)}
                        </p>
                        {donoNaoLida && (
                          <button onClick={() => handleLerResposta(m.id)} disabled={condutaPending}
                            className="mt-1.5 text-[11px] font-sans font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition-colors">
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleEnviarMensagem} className="card-light p-3 space-y-2">
              <textarea value={msgTexto} onChange={e => setMsgTexto(e.target.value)} rows={3} maxLength={1000}
                placeholder="Escreva pro dono…" className="input resize-none text-sm w-full" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={msgAnonima} onChange={e => setMsgAnonima(e.target.checked)} className="accent-amber-600" />
                <span className="text-xs font-sans text-on-cream">Enviar como anônimo</span>
              </label>
              {msgAnonima && (
                <p className="text-[11px] font-sans text-amber-700 bg-amber-500/10 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  O dono não verá seu nome. Anônimo é mão única — ele não poderá responder.
                </p>
              )}
              <button type="submit" disabled={condutaPending || !msgTexto.trim()} className="btn-primary text-sm w-full">
                {condutaPending ? 'Enviando…' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

