'use client'

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
  const hue = Math.round(pct * 1.2)
  const stroke = `hsl(${hue}, 80%, 42%)`
  const glow  = `hsl(${hue}, 80%, 42%)`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* Filtro SVG nativo — segue a forma do arco, sem caixa retangular */}
          <filter id="arc-glow" x="-30%" y="-30%" width="160%" height="160%">
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
            filter="url(#arc-glow)"
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
