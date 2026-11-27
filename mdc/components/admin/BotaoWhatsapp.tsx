'use client'

import { useState } from 'react'
import { linkWhatsapp } from '@/lib/format'

/**
 * Abre um quadro com a mensagem pronta (editável) e manda pro wa.me.
 * `aoEnviar` roda depois de abrir o WhatsApp (ex.: marcar como contatado).
 */
export default function BotaoWhatsapp({
  whatsapp,
  mensagem,
  rotulo = 'Chamar no WhatsApp',
  aoEnviar,
}: {
  whatsapp: string
  mensagem: string
  rotulo?: string
  aoEnviar?: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState(mensagem)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTexto(mensagem)
          setAberto(true)
        }}
        className="btn-sm bg-[#25D366] text-fundo hover:brightness-110"
      >
        {rotulo}
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setAberto(false)}>
          <div className="card w-full max-w-lg rounded-b-none p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-lg font-bold">Mensagem</p>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={7} className="campo" />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <a
                href={linkWhatsapp(whatsapp, texto)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setAberto(false)
                  aoEnviar?.()
                }}
                className="btn-whats"
              >
                Abrir no WhatsApp
              </a>
              <button type="button" onClick={() => setAberto(false)} className="btn-secundario">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
