'use client'

import { useEffect, useState } from 'react'

export default function DicaBloco({ bloco, contexto }: { bloco: string; contexto: string }) {
  const [dica, setDica] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [oculto, setOculto] = useState(false)

  async function carregar(regenerar = false) {
    setLoading(true)
    setErro(false)
    try {
      const r = await fetch('/api/ia/dica-bloco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloco, contexto, regenerar }),
      })
      const j = await r.json()
      if (r.ok) setDica(j.dica)
      else setErro(true)
    } catch {
      setErro(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (oculto) return null

  return (
    <div className="rounded-xl border-l-4 border-primary bg-[#E8F0F7] p-3 mb-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-primary">💡 Dica da Bússola</span>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => carregar(true)} disabled={loading} className="text-xs text-primary disabled:opacity-50">↻ Nova</button>
          <button type="button" onClick={() => setOculto(true)} className="text-xs text-text-muted" aria-label="Esconder dica">✕</button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-1.5 mt-2">
          <div className="h-2.5 bg-primary/15 rounded w-full animate-pulse" />
          <div className="h-2.5 bg-primary/15 rounded w-2/3 animate-pulse" />
        </div>
      ) : erro ? (
        <button type="button" onClick={() => carregar(false)} className="text-xs text-red-600 mt-1">
          Não foi possível gerar dica. Tentar novamente?
        </button>
      ) : (
        <p className="text-sm text-text mt-1 leading-relaxed">{dica}</p>
      )}
    </div>
  )
}
