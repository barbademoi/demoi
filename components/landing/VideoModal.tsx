'use client'

import { useEffect } from 'react'

interface Props {
  videoId: string
  open: boolean
  onClose: () => void
  // 'horizontal' = 16:9 (default, padrao de video do YouTube)
  // 'vertical' = 9:16 (Shorts)
  aspect?: 'horizontal' | 'vertical'
}

// Modal/lightbox que carrega o player do YouTube SO no clique.
// - Fecha no X, no clique fora do video, ou tecla Esc.
// - Pausa o video ao fechar (a gente desmonta o iframe).
// - Trava scroll do body enquanto aberto.

export default function VideoModal({ videoId, open, onClose, aspect = 'horizontal' }: Props) {
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vídeo de demonstração"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      style={{ animation: 'videoModalFadeIn 200ms ease-out' }}
    >
      <style>{`@keyframes videoModalFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

      {/* X close no canto superior direito do viewport */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar vídeo"
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl backdrop-blur-md transition-colors"
      >
        ✕
      </button>

      {/* Container do iframe — para o click outside */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${
          aspect === 'vertical'
            ? 'max-w-[min(420px,calc(100vh-80px)*9/16)] aspect-[9/16]'
            : 'max-w-5xl aspect-video'
        } rounded-2xl overflow-hidden bg-black shadow-2xl`}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          title="Demonstração do BarberMeta"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  )
}
