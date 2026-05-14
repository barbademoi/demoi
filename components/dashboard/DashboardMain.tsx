'use client'

import { useState } from 'react'
import CircularProgress from './CircularProgress'
import LancamentoForm from './LancamentoForm'
import CopiarLinkBtn from './CopiarLinkBtn'
import EditarBarbeiroModal from './EditarBarbeiroModal'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import type { MetaIndividual, ModoPontos, CampanhaComDetalhes } from '@/types/database'

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
  // passthrough for EditarBarbeiroModal / LancamentoForm
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

type MetaSimples = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  faturamento_acumulado: number
}

interface Props {
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
  mes: number
  ano: number
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  faturamentoEditSlot: React.ReactNode
}

function tierBorderClass(tier: string | null) {
  if (tier === 'ouro')   return 'border-yellow-400/70'
  if (tier === 'prata')  return 'border-slate-300/70'
  if (tier === 'bronze') return 'border-amber-600/70'
  return 'border-cream-border'
}

function tierGlowClass(tier: string | null) {
  if (tier === 'ouro')   return '0 0 18px 4px rgba(250,204,21,0.35)'
  if (tier === 'prata')  return '0 0 18px 4px rgba(203,213,225,0.35)'
  if (tier === 'bronze') return '0 0 18px 4px rgba(180,120,60,0.35)'
  return 'none'
}

export default function DashboardMain({
  meta,
  faturamentoExibido,
  progressoColetivo,
  rankingBarbeiros,
  rankingRecepcionistas,
  modoAtual,
  campanha,
  pontosMap,
  rankingPontosBarb,
  rankingPontosRecep,
  mes,
  ano,
  diaAtual,
  diasRestantes,
  diasUteisCorridos,
  diasUteisRestantes,
  faturamentoEditSlot,
}: Props) {
  const [filtro, setFiltro] = useState<'todos' | string>('todos')

  const todos = [...rankingBarbeiros, ...rankingRecepcionistas]
  const barbeiroSel = filtro !== 'todos' ? todos.find(b => b.id === filtro) ?? null : null

  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all border'
  const pillActive = 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
  const pillInactive = 'text-text-muted border-border hover:text-text hover:border-text-muted bg-transparent'

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro('todos')}
          className={`${pillBase} ${filtro === 'todos' ? pillActive : pillInactive}`}
        >
          Todos
        </button>
        {todos.map(b => (
          <button
            key={b.id}
            onClick={() => setFiltro(b.id)}
            className={`${pillBase} ${filtro === b.id ? pillActive : pillInactive}`}
          >
            {b.nome.split(' ')[0]}
          </button>
        ))}
      </div>

      {filtro === 'todos' ? (
        <TodosView
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
      ) : barbeiroSel ? (
        <BarbeiroView
          barbeiro={barbeiroSel}
          posicao={
            barbeiroSel.tipo === 'recepcionista'
              ? rankingRecepcionistas.findIndex(b => b.id === barbeiroSel.id) + 1
              : rankingBarbeiros.findIndex(b => b.id === barbeiroSel.id) + 1
          }
          modoAtual={modoAtual}
          campanha={campanha}
          pontosMap={pontosMap}
          rankingPontosBarb={rankingPontosBarb}
          rankingPontosRecep={rankingPontosRecep}
        />
      ) : null}
    </main>
  )
}

// ── Todos view ───────────────────────────────────────────────────────────────

interface TodosProps {
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
  mes: number
  ano: number
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  faturamentoEditSlot: React.ReactNode
}

function TodosView({
  meta,
  faturamentoExibido,
  progressoColetivo,
  rankingBarbeiros,
  rankingRecepcionistas,
  modoAtual,
  campanha,
  pontosMap,
  rankingPontosBarb,
  rankingPontosRecep,
  mes,
  ano,
  diaAtual: _diaAtual,
  diasRestantes,
  diasUteisCorridos,
  diasUteisRestantes,
  faturamentoEditSlot,
}: TodosProps) {
  const falta = meta ? meta.meta_coletiva - faturamentoExibido : 0
  // Usa dias úteis (Seg–Sáb, sem feriados) para ritmo mais preciso
  const necesarioPorDia = diasUteisRestantes > 0 && falta > 0 ? falta / diasUteisRestantes : 0
  const ritmoColetivo = diasUteisCorridos > 0 ? faturamentoExibido / diasUteisCorridos : 0
  const ritmoOk = ritmoColetivo >= necesarioPorDia

  return (
    <div className="space-y-6">
      {/* Hero: Meta Coletiva */}
      {meta ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl text-text">Meta Coletiva</h2>
              <p className="text-text-muted text-sm font-sans mt-0.5">{nomeMes(mes)} {ano}</p>
            </div>
            {meta.premio_coletivo && (
              <p className="text-text-muted text-xs font-sans border border-border rounded-xl px-3 py-1.5">
                🏆 {meta.premio_coletivo}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Circular chart */}
            <div className="shrink-0">
              <CircularProgress
                pct={progressoColetivo}
                size={210}
                strokeWidth={18}
                centerLabel={`${progressoColetivo}%`}
                centerSub={`de ${formatBRL(meta.meta_coletiva)}`}
              />
            </div>

            {/* Right panel */}
            <div className="flex-1 w-full space-y-5">
              <div>
                <p className="text-text-muted text-xs font-sans mb-1">Faturado no mês</p>
                <p className="font-serif text-4xl text-text">{formatBRL(faturamentoExibido)}</p>
                {falta > 0 && (
                  <p className="text-text-muted text-sm font-sans mt-1">
                    faltam <span className="text-text font-semibold">{formatBRL(falta)}</span>
                  </p>
                )}
              </div>

              {faturamentoEditSlot}

              {/* Countdown */}
              {diasUteisRestantes > 0 && falta > 0 && (
                <div className={`rounded-2xl border p-4 ${ritmoOk ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-xs font-sans">
                      <span className="text-text font-semibold">{diasUteisRestantes}</span> dias úteis restantes
                    </p>
                    <p className={`text-xs font-sans font-semibold ${ritmoOk ? 'text-green-400' : 'text-amber-400'}`}>
                      {ritmoOk ? '✅ No ritmo' : '⚠️ Acelerar'}
                    </p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-text-muted text-xs font-sans">Necessário/dia</p>
                      <p className={`font-serif text-2xl ${ritmoOk ? 'text-green-400' : 'text-amber-400'}`}>
                        {formatBRL(necesarioPorDia)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-xs font-sans">Ritmo atual</p>
                      <p className={`font-serif text-2xl ${ritmoOk ? 'text-green-400' : 'text-amber-400'}`}>
                        {formatBRL(ritmoColetivo)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {progressoColetivo >= 100 && (
                <p className="text-green-400 text-sm font-sans font-semibold text-center">
                  🎉 Meta coletiva atingida!
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-text-muted font-sans text-sm">
            Nenhuma meta configurada para {nomeMes(mes)} {ano}.{' '}
            <span className="text-primary">Configure as metas →</span>
          </p>
        </div>
      )}

      {/* Barbeiros ranking */}
      {rankingBarbeiros.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-text mb-4">
            Barbeiros <span className="text-text-muted text-base font-sans">— {nomeMes(mes)} {ano}</span>
          </h2>
          <div className="space-y-3">
            {rankingBarbeiros.map((barbeiro, idx) => (
              <RankingCard
                key={barbeiro.id}
                barbeiro={barbeiro}
                posicao={idx + 1}
                modoAtual={modoAtual}
                campanha={campanha}
                pontosMap={pontosMap}
                rankingPontos={rankingPontosBarb}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recepcionistas */}
      {rankingRecepcionistas.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-text mb-4">Recepcionistas</h2>
          <div className="space-y-3">
            {rankingRecepcionistas.map((barbeiro, idx) => (
              <RankingCard
                key={barbeiro.id}
                barbeiro={barbeiro}
                posicao={idx + 1}
                modoAtual={modoAtual}
                campanha={campanha}
                pontosMap={pontosMap}
                rankingPontos={rankingPontosRecep}
                isRecep
              />
            ))}
          </div>
        </section>
      )}

      {rankingBarbeiros.length === 0 && rankingRecepcionistas.length === 0 && (
        <div className="card-light p-8 text-center">
          <p className="text-on-cream-muted font-sans text-sm">
            Nenhum colaborador cadastrado. Use &ldquo;+ Barbeiro&rdquo; no menu lateral para começar.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Ranking card ─────────────────────────────────────────────────────────────

interface RankingCardProps {
  barbeiro: BarbeiroRow
  posicao: number
  modoAtual: ModoPontos
  campanha: CampanhaComDetalhes | null
  pontosMap: Record<string, number>
  rankingPontos: { id: string; pts: number }[]
  isRecep?: boolean
}

function RankingCard({ barbeiro, posicao, modoAtual, campanha, pontosMap, rankingPontos, isRecep }: RankingCardProps) {
  const tier = barbeiro.metaInd
    ? calcTier(barbeiro.comissao, barbeiro.metaInd.bronze_comm, barbeiro.metaInd.prata_comm, barbeiro.metaInd.ouro_comm)
    : null
  const progresso = barbeiro.metaInd ? {
    bronze: calcProgresso(barbeiro.comissao, barbeiro.metaInd.bronze_comm),
    prata:  calcProgresso(barbeiro.comissao, barbeiro.metaInd.prata_comm),
    ouro:   calcProgresso(barbeiro.comissao, barbeiro.metaInd.ouro_comm),
  } : null

  const pts = pontosMap[barbeiro.id] ?? 0
  const posicaoPts = rankingPontos.findIndex(r => r.id === barbeiro.id)
  const minPts = isRecep ? (campanha?.min_pontos_recep ?? 400) : (campanha?.min_pontos ?? 0)
  const qualificado = campanha ? pts >= minPts : false

  const posColors = ['metal-text-gold', 'metal-text-silver', 'metal-text-bronze']
  const posClass = posicao <= 3 ? posColors[posicao - 1] : 'text-on-cream-muted'

  return (
    <div className="card-light p-4 sm:p-5">
      <div className="flex items-center gap-4">
        {/* Position */}
        <span className={`font-serif text-xl w-7 text-center shrink-0 ${posClass}`}>{posicao}</span>

        {/* Large photo */}
        <div
          className={`w-16 h-16 rounded-full shrink-0 border-2 overflow-hidden flex items-center justify-center bg-cream-surface font-serif text-2xl text-on-cream-muted ${tierBorderClass(tier)}`}
          style={{ boxShadow: tierGlowClass(tier) }}
        >
          {barbeiro.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
          ) : barbeiro.nome[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-sans font-semibold text-on-cream">{barbeiro.nome}</p>
            <EditarBarbeiroModal barbeiro={barbeiro} />
            {tier && (
              <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                ★ {TIER_CONFIG[tier].label}
              </span>
            )}
            {modoAtual !== 'metas' && campanha && (
              <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full
                ${qualificado ? 'bg-primary/10 text-primary' : 'bg-cream-surface text-on-cream-muted'}`}>
                🏅 {pts} pts{posicaoPts >= 0 && qualificado ? ` · #${posicaoPts + 1}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-on-cream-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
            <CopiarLinkBtn codigo={barbeiro.link_codigo} />
          </div>

          {/* Mini progress bars */}
          {progresso && modoAtual !== 'pontos' && (
            <div className="mt-2.5 space-y-1.5">
              {(['bronze', 'prata', 'ouro'] as const).map(t => {
                const metaVal = barbeiro.metaInd![`${t}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm']
                if (!metaVal || metaVal <= 0) return null
                const pct = progresso[t]
                return (
                  <div key={t} className="flex items-center gap-2">
                    <span className={`text-xs font-sans w-11 text-right shrink-0 ${TIER_CONFIG[t].textClass}`}>
                      {TIER_CONFIG[t].label}
                    </span>
                    <div className="bar-track flex-1 h-2">
                      <div
                        className={`${TIER_CONFIG[t].barClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: pct > 0 ? `${pct}%` : '3px' }}
                      />
                    </div>
                    <span className="text-on-cream-muted text-xs font-sans w-8 shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: value + form */}
        <div className="text-right shrink-0">
          {modoAtual !== 'pontos' && (
            <p className="font-serif text-xl text-on-cream">{formatBRL(barbeiro.comissao)}</p>
          )}
          {modoAtual === 'pontos' && (
            <p className="font-serif text-xl text-on-cream">{pts} pts</p>
          )}
          {modoAtual !== 'pontos' && (
            <LancamentoForm
              barbeiro={barbeiro}
              metaInd={barbeiro.metaInd ?? undefined}
              comissaoAtual={barbeiro.comissao}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Individual barbeiro view ──────────────────────────────────────────────────

interface BarbeiroViewProps {
  barbeiro: BarbeiroRow
  posicao: number
  modoAtual: ModoPontos
  campanha: CampanhaComDetalhes | null
  pontosMap: Record<string, number>
  rankingPontosBarb: { id: string; pts: number }[]
  rankingPontosRecep: { id: string; pts: number }[]
}

function BarbeiroView({ barbeiro, posicao, modoAtual, campanha, pontosMap, rankingPontosBarb, rankingPontosRecep }: BarbeiroViewProps) {
  const tier = barbeiro.metaInd
    ? calcTier(barbeiro.comissao, barbeiro.metaInd.bronze_comm, barbeiro.metaInd.prata_comm, barbeiro.metaInd.ouro_comm)
    : null

  const isRecep = barbeiro.tipo === 'recepcionista'
  const pts = pontosMap[barbeiro.id] ?? 0
  const rp = isRecep ? rankingPontosRecep : rankingPontosBarb
  const posicaoPts = rp.findIndex(r => r.id === barbeiro.id)
  const minPts = isRecep ? (campanha?.min_pontos_recep ?? 400) : (campanha?.min_pontos ?? 0)
  const qualificado = campanha ? pts >= minPts : false

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div
            className={`w-24 h-24 rounded-full shrink-0 border-4 overflow-hidden flex items-center justify-center bg-surface-2 font-serif text-4xl text-text-muted ${tierBorderClass(tier)}`}
            style={{ boxShadow: tierGlowClass(tier) }}
          >
            {barbeiro.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
            ) : barbeiro.nome[0]}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-text-muted text-xs font-sans">#{posicao} no ranking</p>
            <h2 className="font-serif text-2xl text-text mt-0.5">{barbeiro.nome}</h2>
            {modoAtual !== 'pontos' && (
              <p className="font-serif text-3xl mt-1 text-text">{formatBRL(barbeiro.comissao)}</p>
            )}
            {modoAtual === 'pontos' && (
              <p className="font-serif text-3xl mt-1 text-text">{pts} pts</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {tier && (
                <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                  ★ {TIER_CONFIG[tier].label}
                </span>
              )}
              {modoAtual !== 'metas' && campanha && (
                <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full
                  ${qualificado ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-text-muted'}`}>
                  🏅 {pts} pts{posicaoPts >= 0 && qualificado ? ` · #${posicaoPts + 1}` : ''}
                </span>
              )}
              <EditarBarbeiroModal barbeiro={barbeiro} />
              {modoAtual !== 'pontos' && (
                <LancamentoForm
                  barbeiro={barbeiro}
                  metaInd={barbeiro.metaInd ?? undefined}
                  comissaoAtual={barbeiro.comissao}
                />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-text-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
              <CopiarLinkBtn codigo={barbeiro.link_codigo} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress rings */}
      {barbeiro.metaInd && modoAtual !== 'pontos' && (
        <div className="card p-6">
          <h3 className="font-serif text-lg text-text mb-5 text-center">Progresso nas metas</h3>
          <div className="flex justify-center gap-6 flex-wrap">
            {(['bronze', 'prata', 'ouro'] as const).map(t => {
              const commKey = `${t}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm'
              const premioKey = `${t}_premio` as 'bronze_premio' | 'prata_premio' | 'ouro_premio'
              const metaVal = barbeiro.metaInd![commKey]
              const premio = barbeiro.metaInd![premioKey]
              if (!metaVal || metaVal <= 0) return null
              const pct = calcProgresso(barbeiro.comissao, metaVal)
              return (
                <div key={t} className="flex flex-col items-center gap-2">
                  <CircularProgress
                    pct={pct}
                    size={130}
                    strokeWidth={11}
                    centerLabel={`${pct}%`}
                    centerSub={formatBRL(metaVal)}
                  />
                  <p className={`text-sm font-sans font-semibold ${TIER_CONFIG[t].textClass}`}>
                    {TIER_CONFIG[t].label}
                  </p>
                  {premio && <p className="text-text-muted text-xs font-sans text-center">🏆 {premio}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
