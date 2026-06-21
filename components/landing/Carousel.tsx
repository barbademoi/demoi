'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode[]
  // ms entre slides (0 = sem auto-rotate)
  autoRotate?: number
  className?: string
  // mostra prev/next arrows nas laterais (opcional, alem dos dots)
  showArrows?: boolean
}

// Carrossel simples: 1 slide visivel por vez, navegacao via dots + swipe.
// Pra paginas de venda, deixa autoRotate baixinho (4-5s) pra forcar
// rotacao mesmo se usuario nao tocar nos dots.

export default function Carousel({
  children,
  autoRotate = 0,
  className = '',
  showArrows = false,
}: Props) {
  const slides = Array.isArray(children) ? children : [children]
  const total = slides.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  // auto-rotate (pausa quando usuario hover/touch interage)
  useEffect(() => {
    if (!autoRotate || paused || total < 2) return
    const id = setInterval(() => {
      setActive((a) => (a + 1) % total)
    }, autoRotate)
    return () => clearInterval(id)
  }, [autoRotate, paused, total])

  // swipe touch
  const startX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setPaused(true)
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 40) {
      setActive((a) => (a + (dx < 0 ? 1 : -1) + total) % total)
    }
    startX.current = null
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((child, i) => (
            <div key={i} className="w-full shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows opcionais (escondidos em mobile pra nao competir com swipe) */}
      {showArrows && total > 1 && (
        <>
          <button
            onClick={() => setActive((a) => (a - 1 + total) % total)}
            aria-label="Anterior"
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setActive((a) => (a + 1) % total)}
            aria-label="Próximo"
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white items-center justify-center transition-colors"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === active
                  ? 'w-8 bg-[#D4A85A]'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
