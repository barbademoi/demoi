'use client'

import { useState } from 'react'
import { tempoRelativo } from '@/lib/feedbacks'

export interface ItemElogio {
  id: string
  tipo: 'positivo' | 'negativo'
  texto: string
  categoria: string | null
  created_at: string
}

const PAGINA = 20

function Tag({ tipo }: { tipo: 'positivo' | 'negativo' }) {
  if (tipo === 'negativo') {
    return <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">A desenvolver</span>
  }
  return <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Elogio</span>
}

export default function Timeline({ itens }: { itens: ItemElogio[] }) {
  const [mostrar, setMostrar] = useState(PAGINA)

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-text-muted">
          Ainda não há feedbacks registrados. Dê o seu melhor — cada atendimento é uma oportunidade.
        </p>
      </div>
    )
  }

  const visiveis = itens.slice(0, mostrar)

  return (
    <div className="space-y-3">
      {visiveis.map((e) => (
        <article key={e.id} className="rounded-2xl border border-border bg-surface p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <Tag tipo={e.tipo} />
            <span className="text-xs text-text-muted">{tempoRelativo(e.created_at)}</span>
          </div>
          <p className="text-text text-[17px] leading-relaxed mt-2 whitespace-pre-wrap">{e.texto}</p>
          {e.categoria && (
            <span className="inline-block mt-2 text-xs text-text-muted border border-border rounded-full px-2 py-0.5">
              {e.categoria}
            </span>
          )}
        </article>
      ))}

      {mostrar < itens.length && (
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
