'use client'

import { useId } from 'react'

// 3 aneis concentricos pra meta coletiva (estilo Apple Activity Rings).
// Bronze (interno) -> Prata (meio) -> Ouro (externo).
// Centro mostra a % do proximo tier nao fechado; quando todos fecham, vira "🏆".
// Anel que fecha (>= 100%) ganha glow mais intenso.

interface Props {
  pctBronze: number
  pctPrata: number
  pctOuro: number
  size?: number
}

const COLOR_BRONZE = '#C97A3F'
const COLOR_PRATA  = '#CBD5E1'
const COLOR_OURO   = '#FFD700'
const COLOR_TRACK  = '#1E2028'

function Ring({
  cx, cy, r, strokeWidth, pct, color, glowId,
}: {
  cx: number; cy: number; r: number; strokeWidth: number
  pct: number; color: string; glowId: string
}) {
  const c = 2 * Math.PI * r
  const dash = Math.min(Math.max(pct, 0), 100) / 100 * c

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLOR_TRACK} strokeWidth={strokeWidth} />
      {dash > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={`url(#${glowId})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      )}
    </g>
  )
}

export default function RingsProgress({
  pctBronze, pctPrata, pctOuro,
  size = 210,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 14
  // Gap entre aneis = 4. Ouro externo, Prata meio, Bronze interno.
  const rOuro   = (size - strokeWidth) / 2 - 2
  const rPrata  = rOuro  - (strokeWidth + 4)
  const rBronze = rPrata - (strokeWidth + 4)

  const glowBronze = `glow-b-${uid}`
  const glowPrata  = `glow-p-${uid}`
  const glowOuro   = `glow-o-${uid}`

  const proximo =
    pctBronze < 100 ? { label: 'Bronze', pct: pctBronze, color: COLOR_BRONZE }
    : pctPrata  < 100 ? { label: 'Prata',  pct: pctPrata,  color: COLOR_PRATA }
    : pctOuro   < 100 ? { label: 'Ouro',   pct: pctOuro,   color: COLOR_OURO }
    : null

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={glowBronze} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={pctBronze >= 100 ? 5 : 2.5} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={glowPrata} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={pctPrata >= 100 ? 5 : 2.5} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={glowOuro} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={pctOuro >= 100 ? 5 : 2.5} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <Ring cx={cx} cy={cy} r={rOuro}   strokeWidth={strokeWidth} pct={pctOuro}   color={COLOR_OURO}   glowId={glowOuro} />
        <Ring cx={cx} cy={cy} r={rPrata}  strokeWidth={strokeWidth} pct={pctPrata}  color={COLOR_PRATA}  glowId={glowPrata} />
        <Ring cx={cx} cy={cy} r={rBronze} strokeWidth={strokeWidth} pct={pctBronze} color={COLOR_BRONZE} glowId={glowBronze} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        {proximo ? (
          <>
            <p
              className="font-serif text-text leading-none"
              style={{ fontSize: Math.round(size * 0.18) }}
            >
              {proximo.pct}%
            </p>
            <p
              className="font-sans leading-tight mt-1"
              style={{ fontSize: Math.round(size * 0.062), color: proximo.color }}
            >
              próx. {proximo.label}
            </p>
          </>
        ) : (
          <>
            <p className="leading-none" style={{ fontSize: Math.round(size * 0.32) }}>🏆</p>
            <p className="font-sans text-text-muted leading-tight mt-1" style={{ fontSize: Math.round(size * 0.062) }}>
              todos os tiers
            </p>
          </>
        )}
      </div>
    </div>
  )
}
