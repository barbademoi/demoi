'use client'

import { useState } from 'react'
import CircularProgress from './CircularProgress'
import RingsProgress from './RingsProgress'
import CopiarLinkBtn from './CopiarLinkBtn'
import EditarBarbeiroModal from './EditarBarbeiroModal'
import ComunidadeCard from './ComunidadeCard'
import LancamentosBarbeiroModal from './LancamentosBarbeiroModal'
import ComparativoMesAnterior from '@/components/autonomo/ComparativoMesAnterior'
import HistoricoMeses from '@/components/autonomo/HistoricoMeses'
import TicketMedio from '@/components/autonomo/TicketMedio'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import { calcularRitmo } from '@/lib/ritmo'
import { nomeValor } from '@/lib/rotuloValor'
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
  dias_trabalho_mes: number | null
  comissao: number
  metaInd: MetaIndividual | null
  // passthrough for EditarBarbeiroModal / LancamentoForm
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

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

interface Props {
  isAutonomo: boolean
  cicloLabel: string
  comissaoMesAnterior: number
  historicoMeses: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  historicoPorBarbeiro: Record<string, { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]>
  historicoBarbearia: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  faturamentoMesAnterior: number
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
  mes: number
  ano: number
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  diasTrabalhoPadrao: number | null
  diasCorridosCiclo: number
  totalDiasCiclo: number
  faturamentoEditSlot: React.ReactNode
  mostrarTicketMedio: boolean
  mostrarFaturamentoGeral: boolean
  modoMeta: 'faturamento' | 'comissao' | 'ambos'
  baseMeta: 'faturamento' | 'comissao'
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
  isAutonomo,
  cicloLabel,
  comissaoMesAnterior,
  historicoMeses,
  historicoPorBarbeiro,
  historicoBarbearia,
  faturamentoMesAnterior,
  meta,
  faturamentoExibido,
  progressoColetivo,
  progressoColetivoBronze,
  progressoColetivoPrata,
  rankingBarbeiros,
  rankingRecepcionistas,
  modoAtual,
  campanha,
  pontosMap,
  pontosHojePorBarbeiro,
  rankingPontosBarb,
  rankingPontosRecep,
  mes,
  ano,
  diaAtual,
  diasRestantes,
  diasUteisCorridos,
  diasUteisRestantes,
  diasTrabalhoPadrao,
  diasCorridosCiclo,
  totalDiasCiclo,
  faturamentoEditSlot,
  mostrarTicketMedio,
  mostrarFaturamentoGeral,
  modoMeta,
  baseMeta,
}: Props) {
  const todos = [...rankingBarbeiros, ...rankingRecepcionistas]
  // Em modo autônomo, força filtro no único barbeiro (não mostra pills nem ranking)
  const autonomoBarbeiro = isAutonomo ? rankingBarbeiros[0] ?? null : null
  const [filtro, setFiltro] = useState<'todos' | string>(autonomoBarbeiro ? autonomoBarbeiro.id : 'todos')

  const barbeiroSel = filtro !== 'todos' ? todos.find(b => b.id === filtro) ?? null : null

  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all border'
  const pillActive = 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
  const pillInactive = 'text-text-muted border-border hover:text-text hover:border-text-muted bg-transparent'

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Filter pills (escondidos no modo autônomo) */}
      {!isAutonomo && (
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
      )}

      {filtro === 'todos' ? (
        <TodosView
          cicloLabel={cicloLabel}
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
          historicoBarbearia={historicoBarbearia}
          faturamentoMesAnterior={faturamentoMesAnterior}
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
          isAutonomo={isAutonomo}
          cicloLabel={cicloLabel}
          mes={mes}
          comissaoMesAnterior={
            isAutonomo
              ? comissaoMesAnterior
              : (historicoPorBarbeiro[barbeiroSel.id]?.[historicoPorBarbeiro[barbeiroSel.id].length - 2]?.comissao ?? 0)
          }
          historicoMeses={
            isAutonomo
              ? historicoMeses
              : (historicoPorBarbeiro[barbeiroSel.id] ?? [])
          }
          mostrarTicketMedio={mostrarTicketMedio}
        />
      ) : null}

      <ComunidadeCard />
    </main>
  )
}

// ── Todos view ───────────────────────────────────────────────────────────────

interface TodosProps {
  cicloLabel: string
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
  mes: number
  ano: number
  diaAtual: number
  diasRestantes: number
  diasUteisCorridos: number
  diasUteisRestantes: number
  diasTrabalhoPadrao: number | null
  diasCorridosCiclo: number
  totalDiasCiclo: number
  faturamentoEditSlot: React.ReactNode
  mostrarTicketMedio: boolean
  mostrarFaturamentoGeral: boolean
  modoMeta: 'faturamento' | 'comissao' | 'ambos'
  baseMeta: 'faturamento' | 'comissao'
  historicoBarbearia: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  faturamentoMesAnterior: number
}

function TodosView({
  cicloLabel,
  meta,
  faturamentoExibido,
  progressoColetivo,
  progressoColetivoBronze,
  progressoColetivoPrata,
  rankingBarbeiros,
  rankingRecepcionistas,
  modoAtual,
  campanha,
  pontosMap,
  pontosHojePorBarbeiro,
  rankingPontosBarb,
  rankingPontosRecep,
  mes,
  ano,
  diaAtual: _diaAtual,
  diasRestantes,
  diasUteisCorridos,
  diasUteisRestantes,
  diasTrabalhoPadrao,
  diasCorridosCiclo,
  totalDiasCiclo,
  faturamentoEditSlot,
  mostrarTicketMedio,
  mostrarFaturamentoGeral,
  modoMeta,
  baseMeta,
  historicoBarbearia,
  faturamentoMesAnterior,
}: TodosProps) {
  const falta = meta ? meta.meta_coletiva - faturamentoExibido : 0
  // Ritmo coletivo com base nos dias de trabalho padrão da barbearia (ou dias
  // úteis do ciclo, se não configurado). A meta coletiva em R$ não muda.
  const ritmoColet = calcularRitmo({
    comissao: faturamentoExibido,
    metaFoco: meta?.meta_coletiva ?? 0,
    diasCorridosCiclo,
    totalDiasCiclo,
    diasTrabalhoMes: diasTrabalhoPadrao,
    diasUteisCorridos,
    diasUteisRestantes,
  })
  const necesarioPorDia = ritmoColet.necessarioPorDia
  const ritmoColetivo = ritmoColet.ritmoAtual
  const ritmoOk = ritmoColet.ritmoOk
  const unidadeDiaColet = ritmoColet.usaDiasTrabalho ? 'dia de trabalho' : 'dia'
  const diasRestantesColet = Math.round(ritmoColet.baseRestantes)

  // Tiers da meta coletiva (só quando bronze/prata também foram configurados;
  // caso contrário cai no display legado de 1 barra)
  const tiersColetivos = meta ? [
    { id: 'bronze' as const, label: 'Bronze', emoji: '🥉', valor: meta.meta_coletiva_bronze ?? 0 },
    { id: 'prata'  as const, label: 'Prata',  emoji: '🥈', valor: meta.meta_coletiva_prata  ?? 0 },
    { id: 'ouro'   as const, label: 'Ouro',   emoji: '🏆', valor: meta.meta_coletiva },
  ].filter(t => t.valor > 0) : []
  const temTiers = tiersColetivos.length > 1
  const tiersHit = tiersColetivos.filter(t => faturamentoExibido >= t.valor)
  const tierAtingido = tiersHit.length > 0 ? tiersHit[tiersHit.length - 1] : null
  const proximoTier = tiersColetivos.find(t => faturamentoExibido < t.valor)

  return (
    <div className="space-y-6">
      {/* Hero: Meta Coletiva */}
      {meta ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl text-text">Meta Coletiva</h2>
              <p className="text-text-muted text-sm font-sans mt-0.5">{cicloLabel}</p>
            </div>
            {meta.premio_coletivo && (
              <p className="text-text-muted text-xs font-sans border border-border rounded-xl px-3 py-1.5">
                🏆 {meta.premio_coletivo}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* 3 aneis concentricos: Bronze / Prata / Ouro */}
            <div className="shrink-0">
              {temTiers ? (
                <RingsProgress
                  pctBronze={progressoColetivoBronze}
                  pctPrata={progressoColetivoPrata}
                  pctOuro={progressoColetivo}
                  size={210}
                />
              ) : (
                <CircularProgress
                  pct={progressoColetivo}
                  size={210}
                  strokeWidth={18}
                  centerLabel={`${progressoColetivo}%`}
                  centerSub={mostrarFaturamentoGeral ? `de ${formatBRL(meta.meta_coletiva)}` : 'da meta'}
                />
              )}
            </div>

            {/* Right panel */}
            <div className="flex-1 w-full space-y-5">
              <div>
                {mostrarFaturamentoGeral ? (
                  <>
                    {/* Meta Coletiva mede o FATURAMENTO da barbearia (o dono
                        digita "Faturamento acumulado" nas Metas). Comissão é
                        conceito por barbeiro — não entra aqui. */}
                    <p className="text-text-muted text-xs font-sans mb-1">Faturamento no mês</p>
                    <p className="font-serif text-4xl text-text">{formatBRL(faturamentoExibido)}</p>
                    {falta > 0 && (
                      <p className="text-text-muted text-sm font-sans mt-1">
                        faltam <span className="text-text font-semibold">{formatBRL(falta)}</span>
                      </p>
                    )}
                    {temTiers && (
                      <p className="text-text-muted text-xs font-sans mt-2">
                        {tierAtingido
                          ? `${tierAtingido.emoji} ${tierAtingido.label} atingido`
                          : 'Nenhum tier atingido ainda'}
                        {proximoTier && (
                          <> · Faltam <span className="text-text font-semibold">{formatBRL(proximoTier.valor - faturamentoExibido)}</span> pra {proximoTier.emoji} {proximoTier.label}</>
                        )}
                        {!proximoTier && tierAtingido && ' · 🎉 Equipe arrasou!'}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-text-muted text-xs font-sans mb-1">Progresso do mês</p>
                    <p className="font-serif text-4xl text-text">{progressoColetivo}%</p>
                    <p className="text-text-muted text-xs font-sans mt-2">Faturamento geral oculto nas configurações.</p>
                  </>
                )}
              </div>

              <a
                href="/dashboard/lancamento-diario"
                className="inline-flex items-center gap-1.5 text-text-muted text-xs font-sans hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Editar em Lançamento diário →
              </a>

              {/* Countdown — mostra ritmo R$/dia, então esconde quando faturamento geral está off */}
              {mostrarFaturamentoGeral && diasRestantesColet > 0 && falta > 0 && (
                <div className={`rounded-2xl border p-4 ${ritmoOk ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-xs font-sans">
                      <span className="text-text font-semibold">{diasRestantesColet}</span>{' '}
                      {ritmoColet.usaDiasTrabalho
                        ? `${diasRestantesColet === 1 ? 'dia de trabalho' : 'dias de trabalho'} restantes`
                        : `${diasRestantesColet === 1 ? 'dia útil restante' : 'dias úteis restantes'}`}
                    </p>
                    <p className={`text-xs font-sans font-semibold ${ritmoOk ? 'text-green-400' : 'text-amber-400'}`}>
                      {ritmoOk ? '✅ No ritmo' : '⚠️ Acelerar'}
                    </p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-text-muted text-xs font-sans">Necessário/{unidadeDiaColet}</p>
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
            Nenhuma meta configurada para {cicloLabel}.{' '}
            <span className="text-primary">Configure as metas →</span>
          </p>
        </div>
      )}

      {/* Métricas da barbearia inteira (qualquer modalidade, modo metas).
          Comparativo + histórico + ticket coletivo são todos em R$ — somem
          quando o faturamento geral está oculto. */}
      {modoAtual !== 'pontos' && mostrarFaturamentoGeral && (
        <ComparativoMesAnterior
          comissaoAtual={faturamentoExibido}
          comissaoMesAnterior={faturamentoMesAnterior}
          mesAtual={mes}
          variant="dark"
          escopo="coletivo"
          labelPeriodoAnterior={historicoBarbearia[historicoBarbearia.length - 2]?.label}
          labelPeriodoAtual={`Esse ${cicloLabel.includes('—') ? 'ciclo' : 'mês'} até agora`}
        />
      )}
      {modoAtual !== 'pontos' && historicoBarbearia.length > 0 && (
        <HistoricoMeses historico={historicoBarbearia} variant="dark" escopo="coletivo" />
      )}
      {modoAtual !== 'pontos' && mostrarTicketMedio && historicoBarbearia.length > 0 && (
        <TicketMedio historico={historicoBarbearia} variant="dark" escopo="coletivo" />
      )}

      {/* Rankings: comissão e pontos são sempre EXIBIDOS EM SEÇÕES SEPARADAS,
          mesmo no modo 'ambos' — pra não misturar métricas no mesmo card.
            - modo 'metas'  → só Comissão (lista única ordenada por comissão)
            - modo 'pontos' → só Pontos  (com divisão qualificados/abaixo)
            - modo 'ambos'  → Comissão  +  Pontos (uma seção depois da outra)
          Recepcionistas: sempre só Pontos (não participam de meta de comissão). */}
      {rankingBarbeiros.length > 0 && modoAtual !== 'pontos' && (
        <section>
          <h2 className="font-serif text-xl text-text mb-4">
            💰 Barbeiros — {nomeValor(modoMeta, baseMeta)} <span className="text-text-muted text-base font-sans">— {cicloLabel}</span>
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
                pontosHojeBarbeiro={pontosHojePorBarbeiro[barbeiro.id] ?? 0}
                rankingPontos={rankingPontosBarb}
                vista="comissao"
              />
            ))}
          </div>
        </section>
      )}

      {rankingBarbeiros.length > 0 && modoAtual !== 'metas' && campanha && (() => {
        const min = campanha.min_pontos
        const ordPorPontos = [...rankingBarbeiros].sort(
          (a, b) => (pontosMap[b.id] ?? 0) - (pontosMap[a.id] ?? 0),
        )
        const qualificados = ordPorPontos.filter(b => (pontosMap[b.id] ?? 0) >= min)
        const abaixoMin = ordPorPontos.filter(b => (pontosMap[b.id] ?? 0) < min)
        return (
          <>
            {qualificados.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-text mb-4">
                  🏆 Barbeiros — Pontos · Qualificados <span className="text-text-muted text-base font-sans">— {cicloLabel}</span>
                </h2>
                <div className="space-y-3">
                  {qualificados.map((barbeiro, idx) => (
                    <RankingCard
                      key={barbeiro.id}
                      barbeiro={barbeiro}
                      posicao={idx + 1}
                      modoAtual={modoAtual}
                      campanha={campanha}
                      pontosMap={pontosMap}
                      pontosHojeBarbeiro={pontosHojePorBarbeiro[barbeiro.id] ?? 0}
                      rankingPontos={rankingPontosBarb}
                      vista="pontos"
                    />
                  ))}
                </div>
              </section>
            )}
            {abaixoMin.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-text mb-4">
                  {qualificados.length === 0
                    ? <>🏆 Barbeiros — Ranking de Pontos <span className="text-text-muted text-base font-sans">— {cicloLabel}</span></>
                    : <>⏳ Barbeiros — em busca do mínimo de pontos</>}
                </h2>
                <div className="space-y-3">
                  {abaixoMin.map((barbeiro, idx) => (
                    <RankingCard
                      key={barbeiro.id}
                      barbeiro={barbeiro}
                      posicao={qualificados.length + idx + 1}
                      modoAtual={modoAtual}
                      campanha={campanha}
                      pontosMap={pontosMap}
                      pontosHojeBarbeiro={pontosHojePorBarbeiro[barbeiro.id] ?? 0}
                      rankingPontos={rankingPontosBarb}
                      vista="pontos"
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )
      })()}

      {/* Recepcionistas — só seção de Pontos. Eles não participam de metas
          de comissão (só pontuam na campanha). */}
      {rankingRecepcionistas.length > 0 && modoAtual !== 'metas' && campanha && (() => {
        const minRecep = campanha.min_pontos_recep
        const ordPorPontos = [...rankingRecepcionistas].sort(
          (a, b) => (pontosMap[b.id] ?? 0) - (pontosMap[a.id] ?? 0),
        )
        const qualificados = ordPorPontos.filter(b => (pontosMap[b.id] ?? 0) >= minRecep)
        const abaixoMin = ordPorPontos.filter(b => (pontosMap[b.id] ?? 0) < minRecep)
        return (
          <>
            {qualificados.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-text mb-4">
                  🏆 Recepcionistas — Pontos · Qualificados
                </h2>
                <div className="space-y-3">
                  {qualificados.map((barbeiro, idx) => (
                    <RankingCard
                      key={barbeiro.id}
                      barbeiro={barbeiro}
                      posicao={idx + 1}
                      modoAtual={modoAtual}
                      campanha={campanha}
                      pontosMap={pontosMap}
                      pontosHojeBarbeiro={pontosHojePorBarbeiro[barbeiro.id] ?? 0}
                      rankingPontos={rankingPontosRecep}
                      isRecep
                      vista="pontos"
                    />
                  ))}
                </div>
              </section>
            )}
            {abaixoMin.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-text mb-4">
                  {qualificados.length === 0
                    ? '🏆 Recepcionistas — Ranking de Pontos'
                    : '⏳ Recepcionistas — em busca do mínimo de pontos'}
                </h2>
                <div className="space-y-3">
                  {abaixoMin.map((barbeiro, idx) => (
                    <RankingCard
                      key={barbeiro.id}
                      barbeiro={barbeiro}
                      posicao={qualificados.length + idx + 1}
                      modoAtual={modoAtual}
                      campanha={campanha}
                      pontosMap={pontosMap}
                      pontosHojeBarbeiro={pontosHojePorBarbeiro[barbeiro.id] ?? 0}
                      rankingPontos={rankingPontosRecep}
                      isRecep
                      vista="pontos"
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )
      })()}

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
  pontosHojeBarbeiro: number
  rankingPontos: { id: string; pts: number }[]
  isRecep?: boolean
  // 'comissao' = card foca em comissão/metas (esconde badges/valor de pontos).
  // 'pontos'   = card foca em pontos (esconde barras/valor de comissão).
  // omitido    = legacy: deriva do `modoAtual` (modo 'ambos' mostra os dois,
  //              mas é caso a caso — preferir passar vista explícita).
  vista?: 'comissao' | 'pontos'
}

function RankingCard({ barbeiro, posicao, modoAtual, campanha, pontosMap, pontosHojeBarbeiro, rankingPontos, isRecep, vista }: RankingCardProps) {
  // Quando `vista` é passada, ela manda no que o card exibe — permite que
  // o dashboard renderize duas seções (Comissão + Pontos) sem misturar
  // métricas no mesmo card. Sem `vista`, cai no comportamento legacy
  // baseado em modoAtual.
  const mostraComissao = vista ? vista === 'comissao' : modoAtual !== 'pontos'
  const mostraPontos   = vista ? vista === 'pontos'   : modoAtual !== 'metas'
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

  const [lancamentosOpen, setLancamentosOpen] = useState(false)
  const podeVerLancamentos = mostraPontos && campanha !== null

  return (
    <div className="card-light p-4 sm:p-5 relative">
      {/* ✏️ no top-right só em mobile */}
      <div className="sm:hidden absolute top-3 right-3 z-10">
        <EditarBarbeiroModal barbeiro={barbeiro} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Linha 1 mobile: posição + foto + (nome+tier no mobile) | Desktop: só posição+foto */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <span className={`font-serif text-xl w-7 text-center shrink-0 ${posClass}`}>{posicao}</span>

          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 border-2 overflow-hidden flex items-center justify-center bg-cream-surface font-serif text-xl sm:text-2xl text-on-cream-muted ${tierBorderClass(tier)}`}
            style={{ boxShadow: tierGlowClass(tier) }}
          >
            {barbeiro.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
            ) : barbeiro.nome[0]}
          </div>

          {/* No mobile, nome + badges ficam aqui na mesma linha da foto. Desktop esconde. */}
          <div className="sm:hidden flex-1 min-w-0 pr-8">
            <p className="font-sans font-semibold text-on-cream text-base leading-tight break-words">
              {barbeiro.nome}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {tier && (
                <span className={`text-[11px] font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                  ★ {TIER_CONFIG[tier].label}
                </span>
              )}
              {mostraPontos && campanha && (
                <span className={`text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full
                  ${qualificado ? 'bg-primary/10 text-primary' : 'bg-cream-surface text-on-cream-muted'}`}>
                  🏅 {pts} pts{posicaoPts >= 0 && qualificado ? ` · #${posicaoPts + 1}` : ''}
                </span>
              )}
              {mostraPontos && campanha && (
                pontosHojeBarbeiro > 0 ? (
                  <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                    ✅ Lançou hoje · {pontosHojeBarbeiro} pts
                  </span>
                ) : (
                  <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    ⏳ Sem lançamento hoje
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Info (desktop): nome + badges + link + barras */}
        <div className="hidden sm:block flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-sans font-semibold text-on-cream">{barbeiro.nome}</p>
            <EditarBarbeiroModal barbeiro={barbeiro} />
            {tier && (
              <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                ★ {TIER_CONFIG[tier].label}
              </span>
            )}
            {mostraPontos && campanha && (
              <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full
                ${qualificado ? 'bg-primary/10 text-primary' : 'bg-cream-surface text-on-cream-muted'}`}>
                🏅 {pts} pts{posicaoPts >= 0 && qualificado ? ` · #${posicaoPts + 1}` : ''}
              </span>
            )}
            {mostraPontos && campanha && (
              pontosHojeBarbeiro > 0 ? (
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                  ✅ Lançou hoje · {pontosHojeBarbeiro} pts
                </span>
              ) : (
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  ⏳ Sem lançamento hoje
                </span>
              )
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-on-cream-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
            <CopiarLinkBtn codigo={barbeiro.link_codigo} />
            {podeVerLancamentos && (
              <button
                onClick={() => setLancamentosOpen(true)}
                className="text-on-cream-muted hover:text-primary text-xs font-sans transition-colors underline"
              >
                Ver lançamentos
              </button>
            )}
          </div>

          {progresso && mostraComissao && (
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

        {/* Mobile: link + barras + valor full width */}
        <div className="sm:hidden space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-on-cream-muted text-xs font-sans truncate">/b/{barbeiro.link_codigo}</p>
            <CopiarLinkBtn codigo={barbeiro.link_codigo} />
            {podeVerLancamentos && (
              <button
                onClick={() => setLancamentosOpen(true)}
                className="text-on-cream-muted hover:text-primary text-xs font-sans transition-colors underline"
              >
                Ver lançamentos
              </button>
            )}
          </div>

          {progresso && mostraComissao && (
            <div className="space-y-1.5">
              {(['bronze', 'prata', 'ouro'] as const).map(t => {
                const metaVal = barbeiro.metaInd![`${t}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm']
                if (!metaVal || metaVal <= 0) return null
                const pct = progresso[t]
                return (
                  <div key={t} className="flex items-center gap-2">
                    <span className={`text-[11px] font-sans w-12 text-right shrink-0 ${TIER_CONFIG[t].textClass}`}>
                      {TIER_CONFIG[t].label}
                    </span>
                    <div className="bar-track flex-1 h-2">
                      <div
                        className={`${TIER_CONFIG[t].barClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: pct > 0 ? `${pct}%` : '3px' }}
                      />
                    </div>
                    <span className="text-on-cream-muted text-[11px] font-sans w-9 shrink-0 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {mostraComissao ? (
              <p className="font-serif text-lg text-on-cream">{formatBRL(barbeiro.comissao)}</p>
            ) : (
              <p className="font-serif text-lg text-on-cream">{pts} pts</p>
            )}
          </div>
        </div>

        {/* Desktop: valor à direita — comissão OU pontos, conforme a vista */}
        <div className="hidden sm:block text-right shrink-0">
          {mostraComissao ? (
            <p className="font-serif text-xl text-on-cream">{formatBRL(barbeiro.comissao)}</p>
          ) : (
            <p className="font-serif text-xl text-on-cream">{pts} pts</p>
          )}
        </div>
      </div>

      {lancamentosOpen && (
        <LancamentosBarbeiroModal
          barbeiroId={barbeiro.id}
          barbeiroNome={barbeiro.nome}
          onClose={() => setLancamentosOpen(false)}
        />
      )}
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
  isAutonomo: boolean
  cicloLabel: string
  mes: number
  comissaoMesAnterior: number
  historicoMeses: { mes: number; ano: number; comissao: number; atendimentos: number; label: string }[]
  mostrarTicketMedio: boolean
}

function BarbeiroView({ barbeiro, posicao, modoAtual, campanha, pontosMap, rankingPontosBarb, rankingPontosRecep, isAutonomo, cicloLabel, mes, comissaoMesAnterior, historicoMeses, mostrarTicketMedio }: BarbeiroViewProps) {
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
            <p className="text-text-muted text-xs font-sans">
              {isAutonomo ? `Minha meta de ${cicloLabel}` : `#${posicao} no ranking`}
            </p>
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
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-text-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
              <CopiarLinkBtn codigo={barbeiro.link_codigo} />
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo mês anterior (qualquer modalidade, modo metas) */}
      {modoAtual !== 'pontos' && (
        <ComparativoMesAnterior
          comissaoAtual={barbeiro.comissao}
          comissaoMesAnterior={comissaoMesAnterior}
          mesAtual={mes}
          variant="dark"
          labelPeriodoAnterior={historicoMeses[historicoMeses.length - 2]?.label}
          labelPeriodoAtual={`Esse ${cicloLabel.includes('—') ? 'ciclo' : 'mês'} até agora`}
        />
      )}

      {/* Histórico 4 meses (qualquer modalidade, modo metas) */}
      {modoAtual !== 'pontos' && historicoMeses.length > 0 && (
        <HistoricoMeses historico={historicoMeses} variant="dark" />
      )}

      {/* Ticket médio (qualquer modalidade, modo metas) */}
      {modoAtual !== 'pontos' && mostrarTicketMedio && historicoMeses.length > 0 && (
        <TicketMedio historico={historicoMeses} variant="dark" />
      )}

      {/* Progress rings */}
      {barbeiro.metaInd && modoAtual !== 'pontos' && (
        <div className="card p-6">
          <h3 className="font-serif text-lg text-text mb-5 text-center">
            {isAutonomo ? `Minha meta de ${cicloLabel}` : 'Progresso nas metas'}
          </h3>
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
