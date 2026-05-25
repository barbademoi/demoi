'use client'

import { useState } from 'react'

interface Ponto {
  label: string
  valor: number
  atual: boolean
}

export default function GraficoEvolucao({ pontos }: { pontos: Ponto[] }) {
  const [sel, setSel] = useState<number | null>(pontos.length ? pontos.length - 1 : null)

  if (pontos.length < 2) {
    return <p className="text-text-muted text-sm">Ainda não há dados suficientes para o gráfico.</p>
  }

  const W = 320
  const H = 170
  const L = 10
  const R = 10
  const T = 18
  const B = 26

  const valores = pontos.map((p) => p.valor)
  const temNegativo = valores.some((v) => v < 0)
  let min = Math.min(...valores)
  let max = Math.max(...valores)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.15 || 1
  min -= pad
  max += pad

  const x = (i: number) => L + (i * (W - L - R)) / (pontos.length - 1)
  const y = (v: number) => H - B - ((v - min) / (max - min)) * (H - T - B)

  const linha = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')
  const y0 = y(0)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolução do placar">
        {temNegativo && (
          <line x1={L} y1={y0} x2={W - R} y2={y0} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 3" />
        )}

        <polyline points={linha} fill="none" stroke="#1F3A52" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {pontos.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.valor)}
              r={p.atual ? 5 : 3.5}
              fill={p.atual ? '#1F3A52' : '#fff'}
              stroke="#1F3A52"
              strokeWidth={2}
            />
            {/* alvo de toque generoso */}
            <circle cx={x(i)} cy={y(p.valor)} r={14} fill="transparent" onClick={() => setSel(i)} className="cursor-pointer" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#8A93A3">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {sel !== null && (
        <p className="text-center text-sm text-text-muted mt-1">
          Semana de <span className="text-text font-medium">{pontos[sel].label}</span>:{' '}
          <span className={pontos[sel].valor >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {pontos[sel].valor > 0 ? `+${pontos[sel].valor}` : pontos[sel].valor} pontos
          </span>
        </p>
      )}
    </div>
  )
}
