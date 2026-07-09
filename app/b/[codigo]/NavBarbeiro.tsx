'use client'

import { useEffect, useRef } from 'react'

export interface NavItem {
  id: string
  label: string
  badge?: number
}

interface Props {
  open: boolean
  onClose: () => void
  itens: NavItem[]
  ativo: string
  onSelecionar: (id: string) => void
}

// Drawer lateral do /b/[codigo] no MOBILE. Desliza da esquerda com fundo
// escurecido. Fecha ao: escolher item, X, tocar fora, Esc ou deslizar pra
// esquerda. Usa os tokens atuais.
export default function BarbeiroNavDrawer({ open, onClose, itens, ativo, onSelecionar }: Props) {
  const fecharRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)

  // Esc fecha; foca o X ao abrir; trava o scroll do body.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    fecharRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  return (
    <div className={`lg:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchX.current != null && e.changedTouches[0].clientX - touchX.current < -50) onClose()
          touchX.current = null
        }}
        className={`absolute left-0 top-0 h-full w-[82%] max-w-xs bg-surface border-r border-border
          flex flex-col shadow-2xl transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-serif text-xl text-text">Menu</p>
          <button
            ref={fecharRef}
            onClick={onClose}
            aria-label="Fechar menu"
            className="text-text-muted hover:text-text transition-colors p-1 rounded-lg"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {itens.map((it) => {
            const atual = it.id === ativo
            return (
              <button
                key={it.id}
                onClick={() => { onSelecionar(it.id); onClose() }}
                aria-current={atual ? 'page' : undefined}
                className={`w-full min-h-[48px] flex items-center gap-3 px-4 rounded-xl text-left
                  font-sans text-base transition-colors
                  ${atual
                    ? 'bg-primary/15 text-text font-semibold border border-primary/30'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'}`}
              >
                <span className="flex-1">{it.label}</span>
                {it.badge != null && it.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {it.badge}
                  </span>
                )}
                {atual && <span aria-hidden className="text-primary">•</span>}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
