'use client'

import { useEffect, useState } from 'react'
import { trackPlayVideoHero } from '@/lib/pixel'

// Botão SECUNDÁRIO do hero → abre um modal com o player do YouTube (não
// listado) tocando DENTRO da página. Vídeo vertical 9:16.
// O iframe só monta DEPOIS do clique (lazy) — antes, só o botão, hero leve.
// Fechar no X, clique fora ou Esc; ao fechar, o iframe desmonta e o vídeo para.
const VIDEO_ID = '7ENkgsYi2-w'
// youtube-nocookie (modo privacidade) + player limpo. autoplay ao abrir.
const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1&autoplay=1`

export default function VideoHeroButton() {
  const [open, setOpen] = useState(false)

  function abrir() {
    setOpen(true)
    trackPlayVideoHero()
  }

  // Esc fecha + trava o scroll do body enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        Ver o sistema por dentro
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Vídeo: veja o BarberMeta por dentro"
        >
          <div
            className="relative aspect-[9/16] w-auto max-w-[92vw] overflow-hidden rounded-2xl bg-black shadow-2xl"
            style={{ height: 'min(86vh, 820px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar vídeo"
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <iframe
              src={EMBED_SRC}
              title="BarberMeta por dentro"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  )
}
