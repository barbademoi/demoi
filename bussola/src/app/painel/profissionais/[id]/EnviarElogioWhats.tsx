'use client'

import { useState } from 'react'
import { normalizarTelefone, mensagemFeedback, enviarWhats } from '@/lib/whatsapp'

interface ElogioRapido {
  id: string
  texto: string
}

export default function EnviarElogioWhats({
  nome,
  telefone,
  elogios,
}: {
  nome: string
  telefone: string | null
  url: string
  elogios: ElogioRapido[]
}) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)
  const tel = normalizarTelefone(telefone)
  const primeiro = nome.split(' ')[0]

  async function enviar() {
    if (!texto.trim()) return
    await enviarWhats(mensagemFeedback(primeiro, texto.trim()), tel)
    setAberto(false)
  }

  async function copiar() {
    if (!texto.trim()) return
    try {
      await navigator.clipboard.writeText(mensagemFeedback(primeiro, texto.trim()))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (!tel) {
    return (
      <button
        type="button"
        disabled
        title={`Cadastre o WhatsApp de ${primeiro} no perfil`}
        className="btn-secondary px-4 py-2 text-sm opacity-50 cursor-not-allowed"
      >
        📱 Enviar feedback
      </button>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="btn-secondary px-4 py-2 text-sm">
        📱 Enviar feedback
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-8" onClick={() => setAberto(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-3">Enviar feedback pro {primeiro}</h4>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              placeholder="Escreva o feedback…"
              className="input"
            />

            <button
              type="button"
              onClick={enviar}
              disabled={!texto.trim()}
              className="btn-primary w-full py-3 mt-3 disabled:opacity-50"
            >
              📱 Enviar no WhatsApp
            </button>

            <button
              type="button"
              onClick={copiar}
              disabled={!texto.trim()}
              className="btn-secondary w-full py-2.5 mt-2 text-sm disabled:opacity-50"
            >
              {copiado ? 'Mensagem copiada ✓' : 'Copiar mensagem'}
            </button>

            {elogios.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-text-muted mb-2">Ou reaproveite um elogio recente:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {elogios.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setTexto(e.texto)}
                      className="w-full text-left rounded-xl border border-border p-2.5 text-sm text-text-muted hover:border-primary/40 transition-colors"
                    >
                      {e.texto.length > 80 ? `${e.texto.slice(0, 80)}…` : e.texto}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => setAberto(false)} className="text-text-muted hover:text-text text-sm w-full mt-3">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
