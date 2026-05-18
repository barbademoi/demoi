'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardMain from './DashboardMain'
import AvisoSimplificacao from './AvisoSimplificacao'
import BarbeariaWatermark from './BarbeariaWatermark'
import { nomeMes } from '@/lib/utils'
import type { ModoPontos, CampanhaComDetalhes, MetaIndividual } from '@/types/database'

type MetaSimples = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
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
  comissao: number
  metaInd: MetaIndividual | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface Props {
  // Barbearia
  barbeariaNome: string
  mes: number
  ano: number
  // DashboardMain data
  meta: MetaSimples | null
  faturamentoExibido: number
  progressoColetivo: number
  rankingBarbeiros: BarbeiroRow[]
  rankingRecepcionistas: BarbeiroRow[]
  modoAtual: ModoPontos
  campanha: CampanhaComDetalhes | null
  pontosMap: Record<string, number>
  rankingPontosBarb: { id: string; pts: number }[]
  rankingPontosRecep: { id: string; pts: number }[]
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
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
  // Platform stats
  statsBarbearias: number
  statsBarbeiros: number
  // Watermark
  barbeariaLogoUrl: string | null
}

export default function DashboardShell({
  barbeariaNome, mes, ano,
  meta, faturamentoExibido, progressoColetivo,
  rankingBarbeiros, rankingRecepcionistas,
  modoAtual, campanha, pontosMap,
  rankingPontosBarb, rankingPontosRecep,
  diaAtual, diasRestantes, diasUteisCorridos, diasUteisRestantes,
  logoUploadSlot, faturamentoEditSlot,
  modoMesSlot, novoBarbeiroSlot, novaRecepcionistaSlot,
  metasSlot, campanhaSlot, campanhaToggleSlot,
  statsBarbearias, statsBarbeiros,
  barbeariaLogoUrl,
}: Props) {
  const [showConfig, setShowConfig] = useState(false)

  return (
    <div className="min-h-screen flex">
      <BarbeariaWatermark logoUrl={barbeariaLogoUrl} />
      <Sidebar
        barbeariaNome={barbeariaNome}
        showFerramentas={showConfig}
        onFerramentasClick={() => setShowConfig(v => !v)}
      />

      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {logoUploadSlot}
            <div>
              <p className="text-text font-sans font-semibold text-sm">{barbeariaNome}</p>
              <p className="text-text-muted text-xs font-sans">{nomeMes(mes)} {ano}</p>
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
            modoAtual={modoAtual}
            onBack={() => setShowConfig(false)}
          />
        ) : (
          <>
            <AvisoSimplificacao />
            <DashboardMain
            meta={meta}
            faturamentoExibido={faturamentoExibido}
            progressoColetivo={progressoColetivo}
            rankingBarbeiros={rankingBarbeiros}
            rankingRecepcionistas={rankingRecepcionistas}
            modoAtual={modoAtual}
            campanha={campanha}
            pontosMap={pontosMap}
            rankingPontosBarb={rankingPontosBarb}
            rankingPontosRecep={rankingPontosRecep}
            mes={mes}
            ano={ano}
            diaAtual={diaAtual}
            diasRestantes={diasRestantes}
            diasUteisCorridos={diasUteisCorridos}
            diasUteisRestantes={diasUteisRestantes}
            faturamentoEditSlot={faturamentoEditSlot}
          />
          </>
        )}
      </div>
    </div>
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
  modoAtual: ModoPontos
  onBack: () => void
}

function ConfigPanel({
  modoMesSlot, novoBarbeiroSlot, novaRecepcionistaSlot,
  metasSlot, campanhaSlot, campanhaToggleSlot,
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
    </main>
  )
}
