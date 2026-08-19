'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardMain from './DashboardMain'
import BarbeariaWatermark from './BarbeariaWatermark'
import PremiacaoDono from './PremiacaoDono'
import BrindoletaPromoBanner from './BrindoletaPromoBanner'
import BrindoletaAdminAlerta from '@/components/brindoleta/BrindoletaAdminAlerta'
import BrindoletaOfertaPopup from '@/components/brindoleta/BrindoletaOfertaPopup'
import type { ModoPontos, CampanhaComDetalhes, MetaIndividual } from '@/types/database'
import type { PremiacaoResumo } from '@/lib/premios'
import type { ComparativoPeriodo } from '@/lib/comparativoPeriodo'
import type { BrindoletaStatus } from '@/lib/brindoleta/config'

type MetaSimples = {
  id: string
  meta_coletiva: number
  meta_coletiva_bronze?: number
  meta_coletiva_prata?: number
  premio_coletivo: string | null
  premio_coletivo_bronze?: string | null
  premio_coletivo_prata?: string | null
  faturamento_acumulado: number
}

type BarbeiroRow = {
  id: string
  nome: string
  foto_url: string | null
  tipo: 'barbeiro' | 'recepcionista'
  link_codigo: string
  barbearia_id: string
  ativo: boolean
  created_at: string
  dias_trabalho_mes: number | null
  comissao: number
  metaInd: MetaIndividual | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface Props {
  // Premiação do mês (bloco do dono no topo)
  premiacao: PremiacaoResumo
  // Barbearia
  barbeariaNome: string
  cicloLabel: string
  isAutonomo: boolean
  comissaoMesAnterior: number
  historicoMeses: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  historicoPorBarbeiro: Record<string, { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]>
  historicoBarbearia: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  faturamentoMesAnterior: number
  comparativo: ComparativoPeriodo
  mes: number
  ano: number
  // DashboardMain data
  meta: MetaSimples | null
  faturamentoExibido: number
  progressoColetivo: number
  progressoColetivoBronze: number
  progressoColetivoPrata: number
  rankingBarbeiros: BarbeiroRow[]
  rankingRecepcionistas: BarbeiroRow[]
  modoAtual: ModoPontos
  campanha: CampanhaComDetalhes | null
  pontosMap: Record<string, number>
  pontosHojePorBarbeiro: Record<string, number>
  rankingPontosBarb: { id: string; pts: number }[]
  rankingPontosRecep: { id: string; pts: number }[]
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  diasTrabalhoPadrao: number | null
  diasCorridosCiclo: number
  totalDiasCiclo: number
  // Server-rendered slots (can't hold state but can render)
  logoUploadSlot: React.ReactNode
  faturamentoEditSlot: React.ReactNode
  // Config slots
  modoMesSlot: React.ReactNode
  novoBarbeiroSlot: React.ReactNode
  novaRecepcionistaSlot: React.ReactNode
  metasSlot: React.ReactNode | null
  campanhaSlot: React.ReactNode | null
  campanhaToggleSlot: React.ReactNode | null
  resumoReuniaoSlot: React.ReactNode | null
  // Platform stats
  statsBarbearias: number
  statsBarbeiros: number
  // Watermark
  barbeariaLogoUrl: string | null
  // Toggle ticket médio
  mostrarTicketMedio: boolean
  // Toggle faturamento geral (R$ da barbearia inteira)
  mostrarFaturamentoGeral: boolean
  // Modo da barbearia (rótulo do valor principal)
  modoMeta: 'faturamento' | 'comissao' | 'ambos'
  baseMeta: 'faturamento' | 'comissao'
  // Navegação entre meses
  ehPeriodoAtual: boolean
  ehPeriodoPassado: boolean
  monthNavigatorSlot: React.ReactNode
  // Aviso de assinatura perto de vencer / em carência. Vazio pra vitalício.
  avisoAssinaturaSlot?: React.ReactNode
  // Widget "Destaques do mês" (privado do dono) — topo do dashboard
  destaquesSlot: React.ReactNode
  // Travamento "Mês fechado"
  mesFechado: boolean
  mesFechadoEm: string | null
  fecharMesSlot: React.ReactNode
  // Link "Conceder acesso" na sidebar — só pra conta do dono.
  mostrarCortesias?: boolean
  // Brindoleta: status da própria barbearia controla o que aparece.
  brindoletaStatus?: BrindoletaStatus | null
  // Avisos de venda + contador de pendentes — só pro admin (dono da plataforma).
  brindoletaAdmin?: boolean
  brindoletaVendas?: { id: string; empresa: string; valorCents: number; quando: string | null }[]
  // Popup de oferta da Brindoleta. Vem null pra quem JÁ TEM o módulo, pra quem
  // recusou e pra quem fechou faz menos de 7 dias — a decisão é do servidor.
  popupBrindoleta?: { precoLabel: string; midiaUrl: string | null; midiaTipo: 'gif' | 'video' | null } | null
}

export default function DashboardShell({
  premiacao,
  barbeariaNome, cicloLabel, isAutonomo, comissaoMesAnterior, historicoMeses, historicoPorBarbeiro,
  historicoBarbearia, faturamentoMesAnterior, comparativo, mes, ano,
  meta, faturamentoExibido, progressoColetivo, progressoColetivoBronze, progressoColetivoPrata,
  rankingBarbeiros, rankingRecepcionistas,
  modoAtual, campanha, pontosMap, pontosHojePorBarbeiro,
  rankingPontosBarb, rankingPontosRecep,
  diaAtual, diasRestantes, diasUteisCorridos, diasUteisRestantes,
  diasTrabalhoPadrao, diasCorridosCiclo, totalDiasCiclo,
  logoUploadSlot, faturamentoEditSlot,
  modoMesSlot, novoBarbeiroSlot, novaRecepcionistaSlot,
  metasSlot, campanhaSlot, campanhaToggleSlot,
  resumoReuniaoSlot,
  statsBarbearias, statsBarbeiros,
  barbeariaLogoUrl,
  mostrarTicketMedio,
  mostrarFaturamentoGeral,
  modoMeta, baseMeta,
  ehPeriodoAtual, ehPeriodoPassado, monthNavigatorSlot,
  avisoAssinaturaSlot,
  destaquesSlot,
  mesFechado, mesFechadoEm, fecharMesSlot,
  mostrarCortesias = false,
  brindoletaStatus = null,
  brindoletaAdmin = false,
  brindoletaVendas = [],
  popupBrindoleta = null,
}: Props) {
  // Seção ativa da área principal. 'home' é a tela inicial (evolução + ranking);
  // as demais são painéis abertos pelo menu lateral (mutuamente exclusivos).
  const [secao, setSecao] = useState<'home' | 'config' | 'premiacoes' | 'destaques'>('home')
  // Popup e banner falam da MESMA coisa. Mostrar os dois juntos é repetir a
  // oferta na mesma tela, que é o caminho mais curto pra virar irritação.
  const [popupNaTela, setPopupNaTela] = useState(false)
  const showConfig = secao === 'config'
  const alternar = (alvo: 'config' | 'premiacoes' | 'destaques') =>
    setSecao(s => (s === alvo ? 'home' : alvo))

  return (
    <div className="bm-theme min-h-screen flex">
      <BarbeariaWatermark logoUrl={barbeariaLogoUrl} />
      {brindoletaAdmin && <BrindoletaAdminAlerta vendas={brindoletaVendas} />}

      {popupBrindoleta && (
        <BrindoletaOfertaPopup
          precoLabel={popupBrindoleta.precoLabel}
          midiaUrl={popupBrindoleta.midiaUrl}
          midiaTipo={popupBrindoleta.midiaTipo}
          onVisibilidade={setPopupNaTela}
        />
      )}
      <Sidebar
        barbeariaNome={barbeariaNome}
        showFerramentas={showConfig}
        onFerramentasClick={() => alternar('config')}
        secaoDono={secao === 'premiacoes' || secao === 'destaques' ? secao : undefined}
        onPremiacoesClick={() => alternar('premiacoes')}
        onDestaquesClick={() => alternar('destaques')}
        mostrarCortesias={mostrarCortesias}
        brindoletaStatus={brindoletaStatus}
      />

      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {logoUploadSlot}
            <div>
              <p className="text-text font-sans font-semibold text-sm">{barbeariaNome}</p>
              <p className="text-text-muted text-xs font-sans">{cicloLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-sans text-text-muted">
            <span>
              <span className="text-primary font-semibold tabular-nums">+{statsBarbearias}</span> barbearias
            </span>
            <span className="opacity-30">·</span>
            <span>
              <span className="text-primary font-semibold tabular-nums">+{statsBarbeiros}</span> barbeiros
            </span>
          </div>
        </div>

        {/* Mobile stats strip */}
        <div className="lg:hidden flex items-center justify-center gap-3 px-4 py-2 border-b border-border text-[11px] font-sans text-text-muted">
          <span>
            <span className="text-primary font-semibold tabular-nums">+{statsBarbearias}</span> barbearias
          </span>
          <span className="opacity-30">·</span>
          <span>
            <span className="text-primary font-semibold tabular-nums">+{statsBarbeiros}</span> barbeiros
          </span>
        </div>

        {showConfig ? (
          <ConfigPanel
            modoMesSlot={modoMesSlot}
            novoBarbeiroSlot={novoBarbeiroSlot}
            novaRecepcionistaSlot={novaRecepcionistaSlot}
            metasSlot={metasSlot}
            campanhaSlot={campanhaSlot}
            campanhaToggleSlot={campanhaToggleSlot}
            resumoReuniaoSlot={resumoReuniaoSlot}
            modoAtual={modoAtual}
            onBack={() => setSecao('home')}
          />
        ) : secao === 'premiacoes' ? (
          <PainelSecao titulo="Premiações" onBack={() => setSecao('home')}>
            {premiacao.temPremiacao ? (
              <PremiacaoDono premiacao={premiacao} baseMeta={baseMeta} />
            ) : (
              <p className="text-text-muted text-sm font-sans">
                Nenhuma premiação configurada neste ciclo. Configure metas ou uma campanha em
                <span className="text-text"> Metas &amp; Pontos</span> pra ver aqui o total e o detalhe por barbeiro.
              </p>
            )}
          </PainelSecao>
        ) : secao === 'destaques' ? (
          <PainelSecao titulo="Destaques do mês" onBack={() => setSecao('home')}>
            {destaquesSlot}
          </PainelSecao>
        ) : (
          <>
            <div className="max-w-5xl mx-auto px-4 pt-6 pb-2 space-y-4">
              {!popupNaTela && <BrindoletaPromoBanner status={brindoletaStatus} />}
              {monthNavigatorSlot}

              {mesFechado && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40">
                  <p className="text-amber-200 text-xs font-sans leading-relaxed">
                    🔒 <span className="font-semibold capitalize">{cicloLabel}</span> está fechado{mesFechadoEm ? ` desde ${new Date(mesFechadoEm).toLocaleDateString('pt-BR')}` : ''}. Edições bloqueadas.
                  </p>
                  {fecharMesSlot}
                </div>
              )}

              {!mesFechado && ehPeriodoPassado && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-wrap">
                  <p className="text-amber-200 text-xs font-sans leading-relaxed">
                    ⚠️ Você está editando <span className="font-semibold capitalize">{cicloLabel}</span>. As alterações afetam o histórico deste período.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {fecharMesSlot}
                    <a
                      href="/dashboard"
                      className="text-amber-200 hover:text-amber-100 text-xs font-sans underline whitespace-nowrap"
                    >
                      Voltar ao atual
                    </a>
                  </div>
                </div>
              )}
            </div>
            <DashboardMain
            isAutonomo={isAutonomo}
            cicloLabel={cicloLabel}
            comissaoMesAnterior={comissaoMesAnterior}
            historicoMeses={historicoMeses}
            historicoPorBarbeiro={historicoPorBarbeiro}
            historicoBarbearia={historicoBarbearia}
            faturamentoMesAnterior={faturamentoMesAnterior}
            comparativo={comparativo}
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
            mes={mes}
            ano={ano}
            diaAtual={diaAtual}
            diasRestantes={diasRestantes}
            diasUteisCorridos={diasUteisCorridos}
            diasUteisRestantes={diasUteisRestantes}
            diasTrabalhoPadrao={diasTrabalhoPadrao}
            diasCorridosCiclo={diasCorridosCiclo}
            totalDiasCiclo={totalDiasCiclo}
            faturamentoEditSlot={faturamentoEditSlot}
            mostrarTicketMedio={mostrarTicketMedio}
            mostrarFaturamentoGeral={mostrarFaturamentoGeral}
            modoMeta={modoMeta}
            baseMeta={baseMeta}
          />
          </>
        )}
      </div>
    </div>
  )
}

// ── Painel de seção (Premiações / Destaques) ─────────────────────────────────
// Casca simples com "Voltar ao Dashboard" + título, reaproveitando o MESMO
// conteúdo que antes ficava no topo da home. Só reposiciona — nada de cálculo.
function PainelSecao({ titulo, onBack, children }: { titulo: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-surface-2 font-sans text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar ao Dashboard
        </button>
      </div>
      <h1 className="font-serif text-2xl text-text">{titulo}</h1>
      {children}
    </main>
  )
}

// ── Config panel ─────────────────────────────────────────────────────────────

interface ConfigPanelProps {
  modoMesSlot: React.ReactNode
  novoBarbeiroSlot: React.ReactNode
  novaRecepcionistaSlot: React.ReactNode
  metasSlot: React.ReactNode | null
  campanhaSlot: React.ReactNode | null
  campanhaToggleSlot: React.ReactNode | null
  resumoReuniaoSlot: React.ReactNode | null
  modoAtual: ModoPontos
  onBack: () => void
}

function ConfigPanel({
  modoMesSlot, novoBarbeiroSlot, novaRecepcionistaSlot,
  metasSlot, campanhaSlot, campanhaToggleSlot,
  resumoReuniaoSlot,
  modoAtual, onBack,
}: ConfigPanelProps) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-surface-2 font-sans text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar ao Dashboard
        </button>
      </div>
      <h1 className="font-serif text-2xl text-text">Configurações</h1>

      {/* Modo do Mês */}
      <section className="card p-5 space-y-3">
        <div>
          <h2 className="font-serif text-lg text-text">Modo do Mês</h2>
          <p className="text-text-muted text-xs font-sans mt-0.5">
            Escolha como a equipe compete este mês.
          </p>
        </div>
        {modoMesSlot}
      </section>

      {/* Equipe */}
      <section className="card p-5 space-y-3">
        <div>
          <h2 className="font-serif text-lg text-text">Equipe</h2>
          <p className="text-text-muted text-xs font-sans mt-0.5">
            Adicione barbeiros e recepcionistas à equipe.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {novoBarbeiroSlot}
          {novaRecepcionistaSlot}
        </div>
      </section>

      {/* Metas */}
      {modoAtual !== 'pontos' && metasSlot && (
        <section className="card p-5 space-y-3">
          <div>
            <h2 className="font-serif text-lg text-text">Metas Individuais</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              Configure Bronze, Prata e Ouro para cada barbeiro.
            </p>
          </div>
          {metasSlot}
        </section>
      )}

      {/* Campanha de Pontos */}
      {modoAtual !== 'metas' && (campanhaSlot || campanhaToggleSlot) && (
        <section className="card p-5 space-y-3">
          <div>
            <h2 className="font-serif text-lg text-text">Campanha de Pontos</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              Crie e gerencie serviços pontuados e prêmios por posição.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {campanhaSlot}
            {campanhaToggleSlot}
          </div>
        </section>
      )}

      {/* Resumo para reunião — junta metas + campanha + regras e gera texto com IA */}
      {resumoReuniaoSlot && (
        <section className="card p-5 space-y-3">
          <div>
            <h2 className="font-serif text-lg text-text">Resumo para reunião</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              Texto pronto pra apresentar pra equipe ou mandar no grupo do WhatsApp, gerado com IA a partir de tudo o que você configurou.
            </p>
          </div>
          {resumoReuniaoSlot}
        </section>
      )}
    </main>
  )
}
