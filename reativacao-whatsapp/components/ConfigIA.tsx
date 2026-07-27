'use client'

import { useEffect, useState } from 'react'

export default function ConfigIA({
  instrucaoBase,
  onChange,
}: {
  instrucaoBase: string
  onChange: (valor: string) => void
}) {
  const [rascunho, setRascunho] = useState(instrucaoBase)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => setRascunho(instrucaoBase), [instrucaoBase])

  async function salvar() {
    setSalvando(true)
    setSalvo(false)
    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrucaoBase: rascunho }),
      })
      if (!resp.ok) throw new Error()
      onChange(rascunho)
      setSalvo(true)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
      <h2 className="mb-2 text-lg font-semibold">3. Instrução de tom pra IA</h2>
      <p className="mb-3 text-sm text-neutral-400">
        Descreva o tom/estilo que a IA deve usar (ou cole um exemplo de mensagem sua). Ela varia o texto em cima
        disso pra cada cliente.
      </p>
      <textarea
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        rows={3}
        className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={salvar}
          disabled={salvando || rascunho === instrucaoBase}
          className="rounded bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar instrução'}
        </button>
        {salvo && <span className="text-sm text-emerald-400">Salvo.</span>}
      </div>
    </div>
  )
}
