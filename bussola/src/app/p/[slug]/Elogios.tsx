'use client'

import { useState } from 'react'
import Estrelas from '@/components/Estrelas'
import { tempoRelativo } from '@/lib/feedbacks'

export interface Elogio {
  id: string
  texto: string
  estrelas: number | null
  categoria: string | null
  created_at: string
}

const PAGINA = 8

export default function Elogios({ elogios }: { elogios: Elogio[] }) {
  const [mostrar, setMostrar] = useState(PAGINA)

  if (elogios.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted text-sm">
          Ainda não há elogios registrados. Continue dando seu melhor! 💪
        </p>
      </div>
    )
  }

  const visiveis = elogios.slice(0, mostrar)

  return (
    <div className="space-y-3">
      {visiveis.map((e) => (
        <div key={e.id} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <Estrelas value={e.estrelas ?? 0} readOnly size={16} cor="#F5B301" />
            <span className="text-xs text-text-muted">{tempoRelativo(e.created_at)}</span>
          </div>
          <p className="text-text mt-2 whitespace-pre-wrap">{e.texto}</p>
          {e.categoria && (
            <span className="inline-block mt-2 text-xs bg-primary-soft text-primary rounded-full px-2 py-0.5">
              {e.categoria}
            </span>
          )}
        </div>
      ))}

      {mostrar < elogios.length && (
        <button
          type="button"
          onClick={() => setMostrar((m) => m + PAGINA)}
          className="btn-secondary w-full py-3 text-sm"
        >
          Ver mais elogios
        </button>
      )}
    </div>
  )
}
