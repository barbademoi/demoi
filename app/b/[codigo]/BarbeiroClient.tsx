'use client'

import { useState } from 'react'
import { formatBRL, TIER_CONFIG, calcProgresso } from '@/lib/utils'
import { REGRAS_FIXAS } from '@/lib/regras'
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
}

export default function BarbeiroClient({
  barbeiro, barbeariaName: _, mes, ano, diaAtual, diasRestantes, diasUteisCorridos, diasUteisRestantes,
  modo, metaInd, lancamento, progresso, ranking, posicaoRanking,
  faturamentoColetivo, progressoColetivo, progressoColetivoBronze, progressoColetivoPrata,
  metaColetiva, metaColetivaBronze, metaColetivaPrata,
  premioColetivo, premioColetivoBronze, premioColetivoPrata,
  insights, mensagemIA, tiersJaCelebrados, campanha, controlesDiario,
  pontosTotal, rankingPontos, pontosMap, controleHoje, historico,
  visibilidadeRanking, isAutonomo, comissaoMesAnterior, historicoMeses,
  cicloLabel, diaFechamento, mostrarTicketMedio, mostrarFaturamentoGeral,
}: Props) {
  const comissao = lancamento?.comissao_acumulada ?? 0
  // Recepcionista participa só das pontuações — esconde tudo de comissão/metas.
  const isRecepcionista = barbeiro.tipo === 'recepcionista'
  const mostraPontos = modo === 'pontos' || modo === 'ambos'
  const mostraMetas = (modo === 'metas' || modo === 'ambos') && !isRecepcionista
  const [aba, setAba] = useState<'progresso' | 'lancar' | 'regras'>('progresso')
  const [celebracaoFechada, setCelebracaoFechada] = useState(false)

  const posicaoPts = rankingPontos.findIndex(r => r.barbeiro_id === barbeiro.id)
  const minPontosEfetivo = campanha
    ? (barbeiro.tipo === 'recepcionista' ? campanha.min_pontos_recep : campanha.min_pontos)
    : 0
  const qualificado = campanha ? pontosTotal >= minPontosEfetivo : false
  const premioAtual = campanha?.campanha_premios.find(p => p.posicao === posicaoPts + 1)

  // Contagem de assinaturas para bônus
  const assinaturaServico = campanha?.campanha_servicos.find(s =>
    s.nome.toLowerCase().includes('assinatura')
  )
  const totalAssinaturas = assinaturaServico
    ? (controlesDiario ?? []).filter(cd => cd.servico_id === assinaturaServico.id)
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
  // Usa dias úteis (Seg-Sáb, sem feriados) para ritmo mais preciso
  const ritmoAtual = diasUteisCorridos > 0 ? comissao / diasUteisCorridos : 0

  let tierId: 'bronze' | 'prata' | 'ouro' | null = null
  let metaFoco = 0
  if (metaInd) {
    if (comissao < metaInd.bronze_comm) { tierId = 'bronze'; metaFoco = metaInd.bronze_comm }
    else if (comissao < metaInd.prata_comm) { tierId = 'prata'; metaFoco = metaInd.prata_comm }
    else if (comissao < metaInd.ouro_comm) { tierId = 'ouro'; metaFoco = metaInd.ouro_comm }
  }
  const valorNecessarioPorDia = diasUteisRestantes > 0 && metaFoco > comissao
    ? (metaFoco - comissao) / diasUteisRestantes
    : 0
  const ritmoOk = valorNecessarioPorDia === 0 || ritmoAtual >= valorNecessarioPorDia
  const mostrarContagem = mostraMetas && metaInd !== null && diasUteisRestantes > 0 && diasNoMes > 0

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

      {/* Tabs — aparece quando modo inclui pontos, independente de campanha */}
      {mostraPontos && (
        <div className="flex border-b border-border mb-0">
          <button
            onClick={() => setAba('progresso')}
            className={`flex-1 py-3.5 text-sm font-sans font-semibold transition-colors
              ${aba === 'progresso' ? 'text-text border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
          >
            Progresso
          </button>
          <button
            onClick={() => setAba('lancar')}
            className={`flex-1 py-3.5 text-sm font-sans font-semibold transition-colors
              ${aba === 'lancar' ? 'text-text border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
          >
            Lançar dia
          </button>
          {campanha && (
            <button
              onClick={() => setAba('regras')}
              className={`flex-1 py-3.5 text-sm font-sans font-semibold transition-colors
                ${aba === 'regras' ? 'text-text border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
            >
              Regras
            </button>
          )}
        </div>
      )}

      {/* ── ABA: PROGRESSO ── */}
      {(aba === 'progresso' || !mostraPontos) && (
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
                  Faltam {diasUteisRestantes} {diasUteisRestantes === 1 ? 'dia útil' : 'dias úteis'}
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
                      <p className="text-on-cream-muted text-xs font-sans">Necessário/dia útil para {TIER_CONFIG[tierId].label}</p>
                      <p className="font-serif text-2xl text-on-cream">{formatBRL(valorNecessarioPorDia)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-on-cream-muted text-xs font-sans">Seu ritmo atual</p>
                      <p className={`font-serif text-2xl ${ritmoOk ? 'text-green-600' : 'text-amber-500'}`}>
                        {formatBRL(ritmoAtual)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs font-sans px-3 py-2 rounded-xl ${
                    ritmoOk
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {ritmoOk
                      ? `✅ No ritmo certo para ${TIER_CONFIG[tierId].label}`
                      : `⚠️ Precisa de ${formatBRL(valorNecessarioPorDia - ritmoAtual)}/dia útil a mais`}
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

          {/* Ranking pontos da equipe */}
          {mostraPontos && rankingPontos.length > 0 && visibilidadeRanking !== 'proprio' && !isAutonomo && (
            <div className="card-light p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-on-cream">Ranking de pontos</h3>
                {posicaoPts >= 0 && (
                  <span className="text-on-cream-muted text-sm font-sans">
                    Você em <span className="text-on-cream font-semibold">#{posicaoPts + 1}</span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {rankingPontos.slice(0, 8).map((r, i) => {
                  const isMe = r.barbeiro_id === barbeiro.id
                  const b = ranking.find(l => l.barbeiro_id === r.barbeiro_id)
                  const nome = b?.barbeiros?.nome ?? '—'
                  const qual = campanha ? r.pontos >= campanha.min_pontos : true
                  return (
                    <div key={r.barbeiro_id} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                      ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-cream-surface'}`}>
                      <span className={`font-sans text-sm w-5 text-center
                        ${i === 0 ? 'metal-text-gold' : i === 1 ? 'metal-text-silver' : i === 2 ? 'metal-text-bronze' : 'text-on-cream-muted'}`}>
                        {i + 1}
                      </span>
                      <span className={`font-sans text-sm flex-1 ${isMe ? 'text-on-cream font-semibold' : qual ? 'text-on-cream-muted' : 'text-on-cream-muted opacity-50'}`}>
                        {nome} {isMe && '(você)'}
                      </span>
                      {/* Valor só aparece em modo 'completo' OU pra própria linha do barbeiro */}
                      {(visibilidadeRanking === 'completo' || isMe) && (
                        <span className={`font-sans text-sm ${isMe ? 'text-on-cream' : 'text-on-cream-muted'}`}>
                          {r.pontos} pts
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
      {aba === 'lancar' && mostraPontos && (
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
              {REGRAS_FIXAS.map((r, i) => (
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
    </>
  )
}

