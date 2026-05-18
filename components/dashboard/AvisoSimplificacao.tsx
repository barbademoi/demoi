'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'aviso-simplificacao-comissao-dismissed'

export default function AvisoSimplificacao() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) !== '1') {
      setVisivel(true)
    }
  }, [])

  function fechar() {
    setVisivel(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // localStorage indisponível (private mode), tudo bem
    }
  }

  if (!visivel) return null

  return (
    <div className="mx-4 lg:mx-6 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-sm font-sans">
      <span aria-hidden className="text-base leading-none mt-0.5">⚙️</span>
      <p className="flex-1 text-text leading-relaxed">
        <span className="font-semibold">Atualização:</span> agora você só precisa
        digitar a comissão total do barbeiro. Mais simples, sem cálculos confusos.
      </p>
      <button
        onClick={fechar}
        aria-label="Fechar aviso"
        className="text-text-muted hover:text-text transition-colors shrink-0 p-0.5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
