'use client'

import { useState } from 'react'
import { formatarTelefoneBR, linkWhatsapp } from '@/lib/telefone'
import { formatarDataBR } from '@/lib/datas'
import type { ClienteComDias } from '@/lib/types-cliente'

interface Props {
  cliente: ClienteComDias
  instrucaoBase: string
  onGerarMensagem: (nome: string, diasSemCortar: number) => Promise<string>
  onMarcarContatado: (id: string, contatado: boolean) => Promise<void>
}

export default function ClienteRow({ cliente, instrucaoBase, onGerarMensagem, onMarcarContatado }: Props) {
  const [mensagem, setMensagem] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvandoContato, setSalvandoContato] = useState(false)

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      const texto = await onGerarMensagem(cliente.nome, cliente.diasSemCortar)
      setMensagem(texto)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar mensagem.')
    } finally {
      setGerando(false)
    }
  }

  async function marcar(contatado: boolean) {
    setSalvandoContato(true)
    try {
      await onMarcarContatado(cliente.id, contatado)
    } finally {
      setSalvandoContato(false)
    }
  }

  const link = mensagem ? linkWhatsapp(cliente.telefone, mensagem) : null

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-semibold">{cliente.nome}</span>{' '}
          <span className="text-sm text-neutral-400">— {formatarTelefoneBR(cliente.telefone)}</span>
        </div>
        <div className="text-sm">
          <span className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-300">
            {cliente.diasSemCortar} dias sem cortar
          </span>
          <span className="ml-2 text-neutral-500">último corte: {formatarDataBR(cliente.ultimoCorte)}</span>
        </div>
      </div>

      <textarea
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="Clique em “Gerar mensagem” ou escreva a sua aqui..."
        rows={3}
        className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200"
      />
      {erro && <p className="mt-1 text-sm text-red-400">{erro}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={gerar}
          disabled={gerando || !instrucaoBase}
          className="rounded bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-50"
        >
          {gerando ? 'Gerando...' : mensagem ? 'Gerar nova versão' : 'Gerar mensagem'}
        </button>

        <a
          href={link ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!link}
          onClick={(e) => {
            if (!link) e.preventDefault()
          }}
          className={`rounded px-3 py-1.5 text-sm text-white ${
            link ? 'bg-emerald-600 hover:bg-emerald-500' : 'cursor-not-allowed bg-neutral-800 text-neutral-500'
          }`}
        >
          Abrir no WhatsApp
        </a>

        {cliente.contatadoEm ? (
          <span className="flex items-center gap-2 text-sm text-neutral-400">
            Contatado em {new Date(cliente.contatadoEm).toLocaleString('pt-BR')}
            <button
              onClick={() => marcar(false)}
              disabled={salvandoContato}
              className="text-xs text-sky-400 underline hover:text-sky-300"
            >
              desfazer
            </button>
          </span>
        ) : (
          <button
            onClick={() => marcar(true)}
            disabled={salvandoContato}
            className="rounded border border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            Marcar como contatado
          </button>
        )}
      </div>
    </div>
  )
}
