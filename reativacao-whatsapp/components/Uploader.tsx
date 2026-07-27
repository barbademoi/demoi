'use client'

import { useRef, useState } from 'react'
import type { LinhaImportada } from '@/lib/types'

interface Resultado {
  totalLinhas: number
  novos: number
  atualizados: number
  ignorados: LinhaImportada[]
}

export default function Uploader({ onImportado }: { onImportado: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function enviarArquivo(arquivo: File) {
    setEnviando(true)
    setErro(null)
    setResultado(null)
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      const resp = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.erro || 'Falha ao importar o arquivo.')
      setResultado(data)
      onImportado()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao importar.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
      <h2 className="mb-2 text-lg font-semibold">1. Importar planilha</h2>
      <p className="mb-3 text-sm text-neutral-400">
        CSV ou Excel exportado do seu sistema de agenda, com colunas de nome, telefone (com DDD) e data do último
        corte. Pode importar de novo quantas vezes quiser — os dados são mesclados, sem duplicar.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        disabled={enviando}
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) enviarArquivo(arquivo)
        }}
        className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-white file:hover:bg-emerald-500"
      />
      {enviando && <p className="mt-2 text-sm text-neutral-400">Importando...</p>}
      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      {resultado && (
        <div className="mt-3 text-sm text-neutral-300">
          <p>
            {resultado.totalLinhas} linhas lidas — <span className="text-emerald-400">{resultado.novos} novos</span>,{' '}
            <span className="text-sky-400">{resultado.atualizados} atualizados</span>
            {resultado.ignorados.length > 0 && (
              <span className="text-amber-400"> , {resultado.ignorados.length} ignorados</span>
            )}
            .
          </p>
          {resultado.ignorados.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-400">Ver linhas ignoradas</summary>
              <ul className="mt-1 max-h-40 overflow-y-auto text-xs text-neutral-400">
                {resultado.ignorados.map((l) => (
                  <li key={l.linha}>
                    Linha {l.linha}: {l.nome || '(sem nome)'} — {l.erro}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
