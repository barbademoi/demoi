'use client'

import { useState } from 'react'
import CopiarLinkBtn from './CopiarLinkBtn'
import EditarBarbeiroModal from './EditarBarbeiroModal'
import LancamentosBarbeiroModal from './LancamentosBarbeiroModal'
import AnelMeta from './AnelMeta'
import { useMontado } from './useContagem'
import { formatBRL, calcProgresso, TIER_CONFIG } from '@/lib/utils'
import type { PremioBarbeiro } from '@/lib/premios'
import type { MetaIndividual, ModoPontos, Tier } from '@/types/database'

/**
 * CARD DE RANKING DO BARBEIRO.
 *
 * A leitura é de fora pra dentro: posição → quanto falta pro topo (anel) →
 * quem é e quanto fez → quanto já ganhou. As trilhas embaixo são o detalhe
 * pra quem quiser conferir; o card responde "como eu tô?" antes disso.
 *
 * ── AS DUAS TRILHAS DE PRÊMIO ───────────────────────────────────────────────
 * META de faturamento vale SÓ O MAIOR NÍVEL ATINGIDO — quem bate Ouro leva o
 * prêmio do Ouro, não Bronze+Prata+Ouro. Por isso os níveis já passados
 * aparecem como "superado" SEM valor em R$: mostrar o R$ ali daria a entender
 * que soma. CAMPANHA DE PONTOS é outra fonte e SOMA por cima da meta.
 *
 * Quem decide isso é `lib/premios.calcularPremiacao`, a mesma função que
 * alimenta o bloco de premiação do dono e a tela do barbeiro. Este card só
 * exibe o que ela devolve — o dia em que a regra mudar, muda num lugar só.
 */

export interface BarbeiroCard {
  id: string
  barbearia_id: string
  nome: string
  foto_url: string | null
  tipo: 'barbeiro' | 'recepcionista'
  link_codigo: string
  ativo: boolean
  created_at: string
  dias_trabalho_mes: number | null
  comissao: number
  metaInd: MetaIndividual | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const TIERS: Tier[] = ['bronze', 'prata', 'ouro']

const ORDINAL = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º']

/**
 * Cor dos rótulos de metal NO FUNDO ESCURO.
 *
 * As classes `metal-text-*` do sistema são degradês pensados pro card creme —
 * o bronze delas (#7B3F00→#A0522D) some no carvão em texto de 12px. Aqui os
 * tons são versões claras, sólidas, com contraste de sobra. O degradê continua
 * onde ele funciona: na barra, que é uma superfície e não uma letra.
 */
const COR_METAL: Record<Tier, string> = {
  bronze: 'text-[#E08A4B]',
  prata: 'text-[#D1D5DB]',
  ouro: 'text-[#FFD700]',
}

function ordinal(n: number): string {
  return ORDINAL[n - 1] ?? `${n}º`
}

interface ItemComposicao {
  rotulo: string
  /** null = prêmio sem valor em R$ (ex.: "Pizza"), mostrado como texto. */
  valor: number | null
  texto?: string
}

export default function CardRanking({
  barbeiro,
  posicao,
  premio,
  pontos,
  pontosHoje,
  minPontos,
  temCampanha,
  modoAtual,
  vista,
  isRecep,
}: {
  barbeiro: BarbeiroCard
  posicao: number
  premio: PremioBarbeiro | null
  pontos: number
  pontosHoje: number
  minPontos: number
  temCampanha: boolean
  modoAtual: ModoPontos
  vista: 'comissao' | 'pontos'
  isRecep?: boolean
}) {
  const [lancamentosOpen, setLancamentosOpen] = useState(false)
  const montado = useMontado()

  const meta = barbeiro.metaInd
  const metaOuro = meta?.ouro_comm ?? 0
  const tierAtual = premio?.metaTier ?? null

  const mostraMetas = vista === 'comissao' && !isRecep && !!meta
    && TIERS.some((t) => (meta[`${t}_comm` as const] ?? 0) > 0)
  const mostraCampanha = vista === 'pontos' && temCampanha
  // O valor em R$ some no modo só-pontos e pra recepcionista, que não tem meta
  // de faturamento. Os pontos aparecem sempre que existe campanha rodando.
  const mostraValor = modoAtual !== 'pontos' && !isRecep
  const mostraPontos = temCampanha && modoAtual !== 'metas'

  // ── Trilha de pontos ──
  const alvoPts = minPontos > 0 ? minPontos : 0
  const pctPts = alvoPts > 0
    ? Math.min(100, Math.round((pontos / alvoPts) * 100))
    : (pontos > 0 ? 100 : 0)
  const qualificado = alvoPts > 0 ? pontos >= alvoPts : pontos > 0

  // ── Anel: mede a distância até o TOPO da trilha que o card representa ──
  const usaAnelPontos = vista === 'pontos' || metaOuro <= 0
  const pctAnel = usaAnelPontos ? pctPts : calcProgresso(barbeiro.comissao, metaOuro)
  const temAnel = usaAnelPontos ? temCampanha : metaOuro > 0

  // ── Badge de prêmio: maior meta atingida + campanha, somando só o que soma ──
  const composicao: ItemComposicao[] = []
  if (premio) {
    if (premio.metaPremio > 0) {
      composicao.push({ rotulo: `Meta ${premio.metaTierLabel}`, valor: premio.metaPremio })
    } else if (tierAtual && meta) {
      // Nível batido, mas o prêmio cadastrado é texto livre sem R$ ("Pizza").
      // Não vira número, mas também não pode sumir do card.
      const txt = meta[`${tierAtual}_premio` as const]
      if (txt) composicao.push({ rotulo: `Meta ${premio.metaTierLabel}`, valor: null, texto: String(txt) })
    }
    if (premio.campanhaPremio > 0) {
      composicao.push({ rotulo: 'Campanha de pontos', valor: premio.campanhaPremio })
    }
  }
  const totalPremio = premio?.jaGarantido ?? 0
  const temItemSemValor = composicao.some((c) => c.valor === null)
  const rotuloBadge = totalPremio > 0
    ? formatBRL(totalPremio)
    : temItemSemValor ? 'prêmio garantido' : 'sem prêmio'

  // ── Frase do próximo objetivo ──
  let mensagem: string | null = null
  if (!usaAnelPontos && metaOuro > 0) {
    mensagem = barbeiro.comissao >= metaOuro
      ? 'meta Ouro batida! 🔥'
      : `faltam ${formatBRL(metaOuro - barbeiro.comissao)} pra Ouro 🏆`
  } else if (temCampanha) {
    mensagem = qualificado
      ? 'campanha garantida! 🔥'
      : `faltam ${Math.max(0, alvoPts - pontos)} pts pra qualificar 🏆`
  }

  const lider = posicao === 1
  const corPos = posicao === 1 ? COR_METAL.ouro
    : posicao === 2 ? COR_METAL.prata
      : posicao === 3 ? COR_METAL.bronze
        : 'text-text-muted'

  return (
    <div className={`card p-4 sm:p-5 ${lider ? 'card-lider' : ''}`}>
      <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4">
        {/* 1. Posição */}
        <div className="flex w-11 shrink-0 flex-col items-center sm:w-14">
          <span className={`font-serif text-2xl leading-none sm:text-[2rem] ${corPos}`}>
            {ordinal(posicao)}
          </span>
          <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.12em] text-text-muted">
            lugar
          </span>
        </div>

        {/* 2. Mostrador */}
        {temAnel && (
          <AnelMeta
            pct={pctAnel}
            tom={usaAnelPontos ? 'violeta' : 'ouro'}
            rotulo={`${Math.round(pctAnel)}% ${usaAnelPontos ? 'do mínimo de pontos' : 'da meta Ouro'}`}
          />
        )}

        {/* 3. Nome + valor + pontos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-serif text-sm text-text-muted">
              {barbeiro.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={barbeiro.foto_url} alt="" className="h-full w-full object-cover" />
              ) : barbeiro.nome[0]}
            </span>
            <p className="min-w-0 break-words font-sans font-semibold text-text">{barbeiro.nome}</p>
            {lider && (
              <span
                aria-label="líder do ranking"
                title="Líder do ranking"
                className="shrink-0 text-base"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.7))' }}
              >
                👑
              </span>
            )}
            <EditarBarbeiroModal barbeiro={barbeiro} />
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {mostraValor && (
              <p className="font-serif text-2xl leading-none text-text sm:text-[1.75rem]">
                {formatBRL(barbeiro.comissao)}
              </p>
            )}
            {mostraPontos && (
              <p className={`font-sans text-sm font-semibold ${qualificado ? 'text-violet-300' : 'text-text-muted'}`}>
                {pontos} pts
              </p>
            )}
            {!mostraValor && !mostraPontos && (
              <p className="font-serif text-2xl leading-none text-text">{pontos} pts</p>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-sans text-xs text-text-muted">/b/{barbeiro.link_codigo}</p>
            <CopiarLinkBtn codigo={barbeiro.link_codigo} />
            {temCampanha && (
              <button
                onClick={() => setLancamentosOpen(true)}
                className="font-sans text-xs text-text-muted underline transition-colors hover:text-latao"
              >
                Ver lançamentos
              </button>
            )}
            {mostraPontos && (
              pontosHoje > 0 ? (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-green-400">
                  ✅ Lançou hoje · {pontosHoje} pts
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-amber-400">
                  ⏳ Sem lançamento hoje
                </span>
              )
            )}
          </div>
        </div>

        {/* 4. Prêmio total + composição. No mobile cai pra uma linha própria,
            alinhada à esquerda como o resto do card. */}
        <div className="order-last w-full shrink-0 sm:order-none sm:w-auto sm:max-w-[190px] sm:text-right">
          <div
            className={`inline-flex flex-col rounded-xl border px-3 py-2 sm:items-end ${
              totalPremio > 0 || temItemSemValor
                ? 'border-latao/35 bg-latao/10'
                : 'border-border bg-surface-2'
            }`}
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-text-muted">
              já garantido
            </span>
            <span
              className={`font-serif leading-none ${
                totalPremio > 0 ? 'text-xl text-latao sm:text-2xl' : 'text-base text-text-muted'
              }`}
              style={totalPremio > 0 ? { filter: 'drop-shadow(0 0 8px rgba(244,185,66,0.35))' } : undefined}
            >
              {rotuloBadge}
            </span>
          </div>

          {composicao.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {composicao.map((c) => (
                <li key={c.rotulo} className="font-sans text-[11px] leading-snug text-text-muted">
                  {c.rotulo}{' '}
                  <span className="font-semibold text-latao">
                    {c.valor !== null ? `+${formatBRL(c.valor)}` : c.texto}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 5. Próximo objetivo */}
      {mensagem && (
        <p className="mt-4 text-center font-sans text-sm font-semibold text-text">{mensagem}</p>
      )}

      {/* 6. Metas de faturamento */}
      {mostraMetas && meta && (
        <div className="mt-4 space-y-2">
          <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-text-muted">
            Metas de faturamento
          </p>
          {TIERS.map((t) => {
            const alvo = meta[`${t}_comm` as const] ?? 0
            if (alvo <= 0) return null
            const pct = calcProgresso(barbeiro.comissao, alvo)
            const batido = barbeiro.comissao >= alvo
            const ehAtual = tierAtual === t
            return (
              <div key={t} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`w-14 shrink-0 font-sans text-xs font-semibold ${COR_METAL[t]}`}>
                  {TIER_CONFIG[t].label}
                </span>
                <div className="bar-track order-last h-2.5 w-full sm:order-none sm:h-3 sm:w-auto sm:flex-1">
                  <div
                    className={`${TIER_CONFIG[t].barClass} h-full rounded-full transition-[width] duration-1000 ease-out`}
                    style={{ width: montado ? `${Math.max(pct, pct > 0 ? 2 : 0)}%` : '0%' }}
                  />
                </div>
                <span
                  className={`shrink-0 text-right font-sans text-xs sm:w-[142px] ${
                    ehAtual ? 'font-semibold text-latao' : batido ? 'text-text-muted' : 'text-text-muted'
                  }`}
                >
                  {/* Nível já passado NÃO mostra R$: o prêmio é só o do maior
                      nível atingido, e um valor aqui pareceria parcela de soma. */}
                  {ehAtual ? '✓ nível atual' : batido ? '✓ superado' : `faltam ${formatBRL(alvo - barbeiro.comissao)}`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 7. Campanha de pontos */}
      {mostraCampanha && (
        <div className="mt-4 space-y-2">
          <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-text-muted">
            Campanha de pontos
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="w-14 shrink-0 font-sans text-xs font-semibold text-violet-300">
              {pontos}{alvoPts > 0 ? `/${alvoPts}` : ''}
            </span>
            <div className="bar-track order-last h-2.5 w-full sm:order-none sm:h-3 sm:w-auto sm:flex-1">
              <div
                className="bar-violeta h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{ width: montado ? `${Math.max(pctPts, pctPts > 0 ? 2 : 0)}%` : '0%' }}
              />
            </div>
            <span
              className={`shrink-0 text-right font-sans text-xs sm:w-[142px] ${
                premio && premio.campanhaPremio > 0 ? 'font-semibold text-violet-300' : 'text-text-muted'
              }`}
            >
              {premio && premio.campanhaPremio > 0
                ? `✓ +${formatBRL(premio.campanhaPremio)} garantido`
                : qualificado
                  ? '✓ qualificado'
                  : `faltam ${Math.max(0, alvoPts - pontos)} pts`}
            </span>
          </div>
        </div>
      )}

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
