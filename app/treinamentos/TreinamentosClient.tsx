'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SUPORTE, whatsappUrl } from '@/lib/suporte'

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
            <div className="space-y-3 mb-10">
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
                    <div className="flex-1 p-4 flex flex-col justify-center gap-1 min-w-0">
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

          {/* Bloco de suporte */}
          <div className="card p-5 mb-4 border-[#D4A85A]/30 bg-[#D4A85A]/5">
            <p className="text-sm text-text font-sans leading-relaxed mb-4">
              ⚠️ Qualquer dúvida me chama:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1FB855] text-white font-sans font-semibold text-sm rounded-xl transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
                </svg>
                WhatsApp · {SUPORTE.whatsappDisplay}
              </a>

              <a
                href={`mailto:${SUPORTE.email}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 hover:bg-border border border-border text-text font-sans font-semibold text-sm rounded-xl transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 5L2 7" />
                </svg>
                E-mail
              </a>
            </div>
          </div>
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
              <div className="min-w-0 pr-3">
                <p className="text-xs text-text-muted font-sans">
                  Aula {String(selected.ordem).padStart(2, '0')}
                  {selected.duracao ? ` · ${selected.duracao}` : ''}
                </p>
                <h2 className="font-serif text-lg text-text leading-snug truncate">{selected.titulo}</h2>
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
                src={`https://www.youtube-nocookie.com/embed/${selected.youtube_id}?autoplay=1&rel=0`}
                title={selected.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
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
