'use client'

import { useState } from 'react'
import { tempoRelativo } from '@/lib/feedbacks'

export interface ItemElogio {
  id: string
  texto: string
  categoria: string | null
  created_at: string
}

const PAGINA = 20

export default function Timeline({ elogios }: { elogios: ItemElogio[] }) {
  const [mostrar, setMostrar] = useState(PAGINA)

  if (elogios.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-text-muted">
          Ainda não há elogios registrados. Dê o seu melhor — cada atendimento é uma oportunidade.
        </p>
      </div>
    )
  }

  const visiveis = elogios.slice(0, mostrar)

  return (
    <div className="space-y-3">
      {visiveis.map((e) => (
        <article key={e.id} className="rounded-2xl border border-border bg-surface p-4 animate-fade-in">
          <p className="text-xs text-text-muted">{tempoRelativo(e.created_at)}</p>
          <p className="text-text text-[17px] leading-relaxed mt-1.5 whitespace-pre-wrap">{e.texto}</p>
          {e.categoria && (
            <span className="inline-block mt-2 text-xs text-text-muted border border-border rounded-full px-2 py-0.5">
              {e.categoria}
            </span>
          )}
        </article>
      ))}

      {mostrar < elogios.length && (
        <button
          type="button"
          onClick={() => setMostrar((m) => m + PAGINA)}
          className="btn-secondary w-full py-3 text-sm"
        >
          Ver mais
        </button>
      )}
    </div>
  )
}
