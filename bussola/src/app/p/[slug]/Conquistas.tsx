'use client'

import { useState } from 'react'
import { BADGES, type BadgeMeta } from '@/lib/badges'

export default function Conquistas({ conquistadas }: { conquistadas: string[] }) {
  const [aberta, setAberta] = useState<BadgeMeta | null>(null)
  const set = new Set(conquistadas)

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {BADGES.map((b) => {
          const tem = set.has(b.chave)
          return (
            <button
              key={b.chave}
              type="button"
              onClick={() => setAberta(b)}
              className={[
                'rounded-2xl border p-3 flex flex-col items-center gap-1 text-center transition-colors',
                tem ? 'border-primary/30 bg-primary-soft' : 'border-border bg-white',
              ].join(' ')}
            >
              <span className={`text-2xl ${tem ? '' : 'grayscale opacity-40'}`}>{tem ? b.emoji : '🔒'}</span>
              <span className={`text-[11px] leading-tight font-medium ${tem ? 'text-text' : 'text-text-muted'}`}>
                {b.nome}
              </span>
            </button>
          )
        })}
      </div>

      {aberta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setAberta(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-3">{set.has(aberta.chave) ? aberta.emoji : '🔒'}</div>
            <h4 className="font-bold text-text text-lg">{aberta.nome}</h4>
            <p className="text-text-muted text-sm mt-1">{aberta.descricao}</p>
            <p className={`text-sm font-medium mt-3 ${set.has(aberta.chave) ? 'text-green-600' : 'text-text-muted'}`}>
              {set.has(aberta.chave) ? '✓ Conquistada!' : 'Ainda não conquistada'}
            </p>
            <button type="button" onClick={() => setAberta(null)} className="btn-secondary w-full mt-5 py-3">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
