'use client'

import { useState } from 'react'

export default function BotaoCopiar({ texto, rotulo = 'Copiar' }: { texto: string; rotulo?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
        } catch {
          const t = document.createElement('textarea')
          t.value = texto
          document.body.appendChild(t)
          t.select()
          document.execCommand('copy')
          t.remove()
        }
        setOk(true)
        setTimeout(() => setOk(false), 2500)
      }}
      className="btn-secundario w-full sm:w-full"
    >
      {ok ? '✓ Copiado!' : rotulo}
    </button>
  )
}
