'use client'

import { useState } from 'react'
import Estrelas from '@/components/Estrelas'
import { COMPETENCIAS } from '@/lib/profissionais'
import { salvarCompetencia } from '../actions'

export default function CompetenciasEditor({
  id,
  inicial,
}: {
  id: string
  inicial: Record<string, number> | null
}) {
  const [valores, setValores] = useState<Record<string, number>>(inicial ?? {})
  const [salvo, setSalvo] = useState<string | null>(null)

  function alterar(chave: string, valor: number) {
    const anterior = valores[chave] ?? 0
    setValores((v) => ({ ...v, [chave]: valor }))
    salvarCompetencia(id, chave, valor).then((res) => {
      if (res?.error) {
        // Reverte em caso de erro.
        setValores((v) => ({ ...v, [chave]: anterior }))
        return
      }
      setSalvo(chave)
      setTimeout(() => setSalvo((s) => (s === chave ? null : s)), 1500)
    })
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-text mb-4">Competências</h3>
      <div className="space-y-3">
        {COMPETENCIAS.map((c) => (
          <div key={c.chave} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-text">{c.label}</p>
              {salvo === c.chave && <p className="text-verde-musgo text-xs">Salvo</p>}
            </div>
            <Estrelas
              value={valores[c.chave] ?? 0}
              onChange={(v) => alterar(c.chave, v)}
              size={24}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
