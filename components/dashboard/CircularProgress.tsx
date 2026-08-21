'use client'

import { useId } from 'react'

interface Props {
  pct: number
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerSub?: string
}

export default function CircularProgress({
  pct,
  size = 220,
  strokeWidth = 16,
  centerLabel,
  centerSub,
}: Props) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const dash = Math.min(Math.max(pct, 0), 100) / 100 * circumference
  // O filtro é referenciado por id, e a tela pode ter mais de um mostrador.
  // Id fixo faria todos apontarem pro primeiro <filter> renderizado.
  const uid = useId().replace(/:/g, '')
  const glowId = `arc-glow-${uid}`
  const hue = Math.round(pct * 1.2)
  const stroke = `hsl(${hue}, 80%, 42%)`
  const glow  = `hsl(${hue}, 80%, 42%)`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* `overflow: visible` é o que faz o brilho ficar REDONDO. O arco quase
          encosta na borda do viewBox e o <svg> recorta no retângulo por padrão,
          então o halo saía cortado em reta nos quatro lados — lido como sombra
          quadrada. O brilho em si já era vetorial (feGaussianBlur, preso à forma
          do arco); o que faltava era deixar ele caber. */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          {/* Filtro SVG nativo — segue a forma do arco, sem caixa retangular */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2028" strokeWidth={strokeWidth} />
        {/* Progress */}
        {dash > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={`url(#${glowId})`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        )}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {centerLabel && (
          <p className="font-serif text-text leading-none" style={{ fontSize: Math.round(size * 0.13) }}>
            {centerLabel}
          </p>
        )}
        {centerSub && (
          <p className="font-sans text-text-muted leading-tight mt-1" style={{ fontSize: Math.round(size * 0.065) }}>
            {centerSub}
          </p>
        )}
      </div>
    </div>
  )
}
