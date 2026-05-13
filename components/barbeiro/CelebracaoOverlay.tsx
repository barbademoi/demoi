'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { marcarCelebracaoExibida } from '@/app/b/[codigo]/actions'

type Tier = 'bronze' | 'prata' | 'ouro'

interface Props {
  barbeiro_id: string
  nome: string
  tier: Tier
  premio: string | null
  mes: number
  ano: number
  onClose: () => void
}

const TIER_DISPLAY: Record<Tier, { label: string; emoji: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', emoji: '🥉', color: '#A0522D', bg: 'rgba(160,82,45,0.12)' },
  prata:  { label: 'Prata',  emoji: '🥈', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  ouro:   { label: 'Ouro',   emoji: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
}

export default function CelebracaoOverlay({ barbeiro_id, nome, tier, premio, mes, ano, onClose }: Props) {
  const info = TIER_DISPLAY[tier]

  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors =
      tier === 'ouro'   ? ['#FFD700', '#FFA500', '#FFEC3D'] :
      tier === 'prata'  ? ['#C0C0C0', '#E8E8E8', '#A8A9AD'] :
                          ['#CD7F32', '#E8A855', '#A0522D']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [tier])

  async function handleClose() {
    await marcarCelebracaoExibida(barbeiro_id, mes, ano, tier)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8,9,13,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in text-center max-w-xs w-full space-y-6">

        {/* Tier icon */}
        <div
          className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-6xl"
          style={{ background: info.bg, boxShadow: `0 0 40px 12px ${info.color}44` }}
        >
          {info.emoji}
        </div>

        {/* Title */}
        <div>
          <p className="text-text-muted text-sm font-sans uppercase tracking-widest mb-1">
            {nome}
          </p>
          <h2 className="font-serif text-4xl" style={{ color: info.color }}>
            META {info.label.toUpperCase()}
          </h2>
          <p className="font-serif text-xl text-text mt-1">BATIDA!</p>
        </div>

        {/* Premio */}
        {premio && (
          <div
            className="rounded-2xl px-6 py-4"
            style={{ background: info.bg, border: `1px solid ${info.color}33` }}
          >
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">Seu prêmio</p>
            <p className="font-serif text-2xl text-text">{premio}</p>
          </div>
        )}

        <button
          onClick={handleClose}
          className="btn-primary w-full text-base py-4"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
