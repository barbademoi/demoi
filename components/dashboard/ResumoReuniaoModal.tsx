'use client'

import { useState, useTransition } from 'react'
import { gerarResumoReuniao } from '@/app/dashboard/resumo/actions'

interface Props {
  mes: number
  ano: number
}

export default function ResumoReuniaoModal({ mes, ano }: Props) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [isPending, startTransition] = useTransition()

  function gerar() {
    setErro(null)
    setTexto('')
    setCopiado(false)
    startTransition(async () => {
      const res = await gerarResumoReuniao(mes, ano)
      if ('error' in res) setErro(res.error)
      else setTexto(res.texto)
    })
  }

  function abrir() {
    setOpen(true)
    gerar()
  }

  function copiar() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setErro('Copiar não está disponível neste navegador.')
      return
    }
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }).catch(() => {
      setErro('Não foi possível copiar.')
    })
  }

  function whatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!open) {
    return (
      <button
        onClick={abrir}
        className="btn-ghost text-sm py-2 px-4 border border-border flex items-center gap-2"
      >
        🤖 Gerar resumo para reunião
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span aria-hidden>🤖</span>
            <h2 className="font-serif text-xl text-text">Resumo para reunião</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isPending && (
            <div className="text-center py-12 space-y-3">
              <p className="text-4xl" aria-hidden>🤖</p>
              <p className="font-sans text-sm text-text">Gerando o resumo…</p>
              <p className="text-text-muted text-xs font-sans">Levo uns segundos lendo metas, campanha e regras.</p>
            </div>
          )}

          {!isPending && erro && (
            <div className="text-center py-8 space-y-3">
              <p className="text-red-400 text-sm font-sans">{erro}</p>
              <button onClick={gerar} className="btn-ghost text-sm py-2 px-4 border border-border">
                Tentar de novo
              </button>
            </div>
          )}

          {!isPending && !erro && texto && (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-text-muted text-xs font-sans">
                  Edite o que quiser antes de copiar ou enviar pro grupo.
                </p>
                <button
                  onClick={gerar}
                  className="text-xs font-sans text-text-muted hover:text-text shrink-0"
                  title="Gerar novamente"
                >
                  ↻ Gerar de novo
                </button>
              </div>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={18}
                className="input w-full text-sm font-sans leading-relaxed"
                style={{ resize: 'vertical', minHeight: '360px', whiteSpace: 'pre-wrap' }}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {!isPending && !erro && texto && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
            <button onClick={copiar} className="btn-ghost flex-1 text-sm py-2.5">
              {copiado ? '✓ Copiado' : '📋 Copiar texto'}
            </button>
            <button onClick={whatsApp} className="btn-primary flex-1 text-sm py-2.5">
              📤 Enviar no WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
