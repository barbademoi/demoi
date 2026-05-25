'use client'

import { useState } from 'react'
import { normalizarTelefone, linkWhats, mensagemElogio } from '@/lib/whatsapp'

interface ElogioRapido {
  id: string
  texto: string
}

export default function EnviarElogioWhats({
  nome,
  telefone,
  url,
  elogios,
}: {
  nome: string
  telefone: string | null
  url: string
  elogios: ElogioRapido[]
}) {
  const [aberto, setAberto] = useState(false)
  const [livre, setLivre] = useState(false)
  const [texto, setTexto] = useState('')
  const tel = normalizarTelefone(telefone)
  const primeiro = nome.split(' ')[0]

  function enviar(t: string) {
    if (!tel || !t.trim()) return
    window.open(linkWhats(tel, mensagemElogio(primeiro, t.trim(), url)), '_blank')
    setAberto(false)
    setLivre(false)
    setTexto('')
  }

  if (!tel) {
    return (
      <button
        type="button"
        disabled
        title={`Cadastre o WhatsApp de ${primeiro} no perfil`}
        className="btn-secondary px-4 py-2 text-sm opacity-50 cursor-not-allowed"
      >
        📱 Enviar elogio
      </button>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="btn-secondary px-4 py-2 text-sm">
        📱 Enviar elogio
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-3">Enviar elogio pro {primeiro}</h4>

            {!livre ? (
              <div className="space-y-2">
                {elogios.length === 0 && (
                  <p className="text-text-muted text-sm">Nenhum elogio registrado ainda. Use a mensagem livre.</p>
                )}
                {elogios.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => enviar(e.texto)}
                    className="w-full text-left rounded-xl border border-border p-3 text-sm text-text hover:border-primary/40 transition-colors"
                  >
                    {e.texto.length > 80 ? `${e.texto.slice(0, 80)}…` : e.texto}
                  </button>
                ))}
                <button type="button" onClick={() => setLivre(true)} className="btn-secondary w-full py-2.5 text-sm mt-1">
                  ✍️ Mensagem livre
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  placeholder="Escreva o reconhecimento…"
                  className="input"
                  autoFocus
                />
                <button type="button" onClick={() => enviar(texto)} disabled={!texto.trim()} className="btn-primary w-full py-3">
                  📱 Enviar no WhatsApp
                </button>
                <button type="button" onClick={() => setLivre(false)} className="text-text-muted text-sm w-full">
                  Voltar
                </button>
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
