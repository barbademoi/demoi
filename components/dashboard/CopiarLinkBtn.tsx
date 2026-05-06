'use client'

import { useState } from 'react'

export default function CopiarLinkBtn({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    const url = `${window.location.origin}/b/${codigo}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <button
      onClick={copiar}
      className="text-xs font-sans text-text-muted hover:text-primary transition-colors px-1"
      title={`Copiar link de /b/${codigo}`}
    >
      {copiado ? '✓ copiado' : '⎘ copiar link'}
    </button>
  )
}
