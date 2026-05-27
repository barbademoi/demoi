'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RotateCw } from 'lucide-react'

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
    <div className="rounded-md border-l-[3px] border-marrom bg-linho p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 font-semibold text-marrom text-sm">
          <Sparkles size={16} strokeWidth={1.5} /> Resumo da semana pela IA
        </h3>
        <button type="button" onClick={() => carregar(true)} disabled={loading} className="inline-flex items-center gap-1 text-xs text-marrom disabled:opacity-50">
          <RotateCw size={13} strokeWidth={1.5} /> Atualizar
        </button>
      </div>
      <p className="text-sm text-grafite italic mt-2">
        {loading ? 'Gerando resumo…' : resumo ?? 'Resumo indisponível no momento.'}
      </p>
    </div>
  )
}
