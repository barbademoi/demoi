'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Treinamento = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  youtube_id: string
  duracao: string | null
}

interface Props {
  treinamentos: Treinamento[]
}

export default function TreinamentosClient({ treinamentos }: Props) {
  const [selected, setSelected] = useState<Treinamento | null>(null)

  const fechar = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, fechar])

  return (
    <>
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl text-text">Treinamentos</h1>
              <p className="text-text-muted text-sm font-sans mt-0.5">
                Aprenda a usar o BarberMeta no seu dia a dia
              </p>
            </div>
            <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
          </div>

          {treinamentos.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-text-muted text-sm font-sans">
                Nenhum treinamento disponível ainda. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {treinamentos.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="w-full card p-0 overflow-hidden hover:border-primary/40 transition-colors text-left group"
                >
                  <div className="flex items-stretch gap-0">
                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-32 sm:w-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${t.youtube_id}/mqdefault.jpg`}
                        alt={t.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black ml-0.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-sans font-semibold tabular-nums">
                          {String(t.ordem).padStart(2, '0')}
                        </span>
                        {t.duracao && (
                          <span className="text-xs bg-surface-2 border border-border text-text-muted font-sans px-2 py-0.5 rounded-full">
                            {t.duracao}
                          </span>
                        )}
                      </div>
                      <p className="font-sans font-semibold text-text text-sm leading-snug">
                        {t.titulo}
                      </p>
                      {t.descricao && (
                        <p className="text-xs text-text-muted font-sans leading-relaxed line-clamp-2">
                          {t.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={fechar}
        >
          <div
            className="w-full max-w-3xl bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-xs text-text-muted font-sans">
                  Aula {String(selected.ordem).padStart(2, '0')}
                  {selected.duracao ? ` · ${selected.duracao}` : ''}
                </p>
                <h2 className="font-serif text-lg text-text leading-snug">{selected.titulo}</h2>
              </div>
              <button
                onClick={fechar}
                className="text-text-muted hover:text-text transition-colors p-1 shrink-0"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* YouTube iframe */}
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selected.youtube_id}?autoplay=1&rel=0`}
                title={selected.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {selected.descricao && (
              <div className="px-5 py-4 border-t border-border">
                <p className="text-sm text-text-muted font-sans leading-relaxed">{selected.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
