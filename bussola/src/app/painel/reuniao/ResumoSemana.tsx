'use client'

import { useEffect, useState } from 'react'

export default function ResumoSemana() {
  const [resumo, setResumo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregar(regenerar = false) {
    setLoading(true)
    try {
      const r = await fetch('/api/ia/resumo-semana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerar }),
      })
      const j = await r.json()
      setResumo(r.ok ? j.resumo : null)
    } catch {
      setResumo(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-primary text-sm">Resumo da semana pela IA</h3>
        <button type="button" onClick={() => carregar(true)} disabled={loading} className="text-xs text-primary disabled:opacity-50">
          ↻ Atualizar
        </button>
      </div>
      <p className="text-sm text-text mt-2">
        {loading ? 'Gerando resumo…' : resumo ?? 'Resumo indisponível no momento.'}
      </p>
    </div>
  )
}
