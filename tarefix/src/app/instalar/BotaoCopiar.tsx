'use client'

import { useState } from 'react'

export function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false)
  const [mostrar, setMostrar] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setMostrar(true) // sem permissão de área de transferência: mostra o texto para copiar na mão
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className="botao">
          {copiado ? 'Copiado ✓' : rotulo}
        </button>
        <button type="button" onClick={() => setMostrar((m) => !m)} className="botao-secundario">
          {mostrar ? 'Esconder' : 'Ver o SQL'}
        </button>
      </div>
      {mostrar && (
        <textarea
          readOnly
          value={texto}
          onFocus={(e) => e.currentTarget.select()}
          className="campo h-48 py-3 font-mono text-xs"
        />
      )}
    </div>
  )
}
