'use client'

import { useState } from 'react'

export default function SugestaoFala({ feedbackId }: { feedbackId: string }) {
  const [sugestao, setSugestao] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function gerar(regenerar = false) {
    setLoading(true)
    setErro(false)
    try {
      const r = await fetch('/api/ia/sugerir-fala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, regenerar }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setSugestao(j.sugestao)
    } catch {
      setErro(true)
    }
    setLoading(false)
  }

  async function copiar() {
    if (!sugestao) return
    try {
      await navigator.clipboard.writeText(sugestao)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (sugestao) {
    return (
      <div className="mt-2 rounded-xl bg-background border border-border p-3">
        <p className="text-sm text-text italic">{sugestao}</p>
        <div className="flex gap-4 mt-2">
          <button type="button" onClick={() => gerar(true)} disabled={loading} className="text-xs text-primary font-medium disabled:opacity-50">
            {loading ? 'Gerando…' : '↻ Gerar nova sugestão'}
          </button>
          <button type="button" onClick={copiar} className="text-xs text-text-muted">
            {copiado ? 'Copiado ✓' : '📋 Copiar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={() => gerar(false)} disabled={loading} className="text-xs text-primary font-medium disabled:opacity-50">
        {loading ? 'Gerando…' : '💡 Sugestão de fala'}
      </button>
      {erro && (
        <button type="button" onClick={() => gerar(false)} className="text-xs text-red-600 ml-3">
          Não foi possível gerar. Tentar de novo?
        </button>
      )}
    </div>
  )
}
