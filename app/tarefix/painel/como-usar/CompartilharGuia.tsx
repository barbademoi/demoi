'use client'

import { useEffect, useState } from 'react'
import { useAviso } from '@/components/tarefix/ui'

/** Botões para mandar o guia da equipe (/tarefix/ajuda) pelo WhatsApp ou copiar. */
export function CompartilharGuia() {
  const [origem, setOrigem] = useState('')
  const aviso = useAviso()
  useEffect(() => setOrigem(window.location.origin), [])
  const link = `${origem}/tarefix/ajuda`
  const texto = `Pessoal, aqui está o passo a passo de como usar o Tarefix no celular (link, PIN, check, foto e notificações):\n${link}`
  return (
    <div className="grid grid-cols-2 gap-2">
      <a className="tf-botao" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">
        Enviar no WhatsApp
      </a>
      <button
        type="button"
        className="tf-botao2"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link)
            aviso.mostrar('Link copiado')
          } catch {
            prompt('Copie o link:', link)
          }
        }}
      >
        Copiar link
      </button>
      {aviso.elemento}
    </div>
  )
}
