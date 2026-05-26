'use client'

import { useEffect, useRef, useState } from 'react'

const V = 256 // tamanho do círculo de enquadramento (px)
const OUT = 512 // tamanho final salvo

export default function RecortadorFoto({
  file,
  onConfirm,
  onCancel,
}: {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const [url] = useState(() => URL.createObjectURL(file))
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const base = nat ? Math.max(V / nat.w, V / nat.h) : 1
  const eScale = base * zoom
  const dispW = nat ? nat.w * eScale : V
  const dispH = nat ? nat.h * eScale : V

  function clamp(x: number, y: number) {
    const minX = V - dispW
    const minY = V - dispH
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) }
  }

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const im = e.currentTarget
    const w = im.naturalWidth
    const h = im.naturalHeight
    setNat({ w, h })
    const b = Math.max(V / w, V / h)
    setOff({ x: (V - w * b) / 2, y: (V - h * b) / 2 })
  }

  // Reenquadra dentro dos limites quando o zoom muda.
  useEffect(() => {
    if (nat) setOff((o) => clamp(o.x, o.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, nat])

  function pointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function pointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    setOff(clamp(drag.current.ox + (e.clientX - drag.current.x), drag.current.oy + (e.clientY - drag.current.y)))
  }
  function pointerUp() {
    drag.current = null
  }

  function confirmar() {
    const im = imgRef.current
    if (!im || !nat) return
    const c = document.createElement('canvas')
    c.width = OUT
    c.height = OUT
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(im, -off.x / eScale, -off.y / eScale, V / eScale, V / eScale, 0, 0, OUT, OUT)
    c.toBlob((b) => b && onConfirm(b), 'image/webp', 0.85)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-surface rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-semibold text-text mb-4 text-center">Enquadrar foto</h4>

        <div
          className="relative mx-auto rounded-full overflow-hidden bg-border cursor-move select-none"
          style={{ width: V, height: V, touchAction: 'none' }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerLeave={pointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt=""
            onLoad={onLoad}
            draggable={false}
            style={{ position: 'absolute', left: off.x, top: off.y, width: dispW, height: dispH, maxWidth: 'none' }}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full mt-4 accent-primary"
        />
        <p className="text-xs text-text-muted text-center mt-1">Arraste pra posicionar · use a barra pra dar zoom</p>

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={confirmar} disabled={!nat} className="btn-primary flex-1 disabled:opacity-50">
            Usar foto
          </button>
          <button type="button" onClick={onCancel} className="text-text-muted hover:text-text px-4">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
