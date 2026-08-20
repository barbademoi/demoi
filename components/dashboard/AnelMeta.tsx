'use client'

import { useId } from 'react'
import { useContagem } from './useContagem'

/**
 * MOSTRADOR CIRCULAR DO CARD DE RANKING.
 *
 * Um anel só, com o % no meio. Ele mede a distância até o TOPO — a meta Ouro
 * (ou o mínimo da campanha, quando o card é de pontos) — porque é isso que a
 * pessoa quer saber de relance: quanto falta pro melhor prêmio, não quantos
 * degraus existem.
 *
 * O gradiente e o brilho vêm por SVG e não por classe: o anel é um traço
 * curvo, e degradê em stroke não sai de utilitário de Tailwind.
 */

const R = 42
const CIRC = 2 * Math.PI * R

const TONS = {
  ouro: {
    paradas: ['#92400E', '#FFD700', '#D97706'],
    brilho: 'drop-shadow(0 0 7px rgba(255, 215, 0, 0.55))',
    texto: '#FFD700',
  },
  violeta: {
    paradas: ['#4C1D95', '#C4B5FD', '#7C3AED'],
    brilho: 'drop-shadow(0 0 7px rgba(167, 139, 250, 0.5))',
    texto: '#C4B5FD',
  },
} as const

export default function AnelMeta({
  pct,
  tom = 'ouro',
  rotulo,
}: {
  pct: number
  tom?: keyof typeof TONS
  /** Lido por leitor de tela: "78% da meta Ouro". */
  rotulo: string
}) {
  // useId porque o gradiente é referenciado por id, e a lista mostra um anel
  // por barbeiro — ids repetidos fariam todos herdarem o primeiro gradiente.
  const id = useId().replace(/:/g, '')
  const alvo = Math.max(0, Math.min(100, pct))
  const animado = useContagem(alvo, 1100)
  const t = TONS[tom]

  return (
    <div
      className="relative h-[84px] w-[84px] shrink-0 sm:h-[96px] sm:w-[96px]"
      role="img"
      aria-label={rotulo}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={t.paradas[0]} />
            <stop offset="50%" stopColor={t.paradas[1]} />
            <stop offset="100%" stopColor={t.paradas[2]} />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r={R} fill="none" stroke="#161820" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          // Anel vazio precisa de traço ZERO, não de um risquinho: um toco de
          // arco no topo lê como "já começou" pra quem ainda não faturou nada.
          strokeDashoffset={CIRC - (CIRC * animado) / 100}
          style={{ filter: alvo > 0 ? t.brilho : 'none' }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-xl leading-none sm:text-2xl" style={{ color: t.texto }}>
          {Math.round(animado)}
          <span className="text-sm sm:text-base">%</span>
        </span>
      </div>
    </div>
  )
}
