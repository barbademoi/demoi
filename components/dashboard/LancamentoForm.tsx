'use client'

import { useState, useTransition } from 'react'
import { lancarComissao } from '@/app/dashboard/actions'
import { formatBRL } from '@/lib/utils'
import type { Barbeiro, MetaIndividual } from '@/types/database'

interface Props {
  barbeiro: Barbeiro
  metaInd?: MetaIndividual
  comissaoAtual: number
}

export default function LancamentoForm({ barbeiro, metaInd, comissaoAtual }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await lancarComissao(fd)
      if (res && 'error' in res) {
        setErro(res.error ?? null)
      } else {
        setSucesso(true)
        setOpen(false)
        setTimeout(() => setSucesso(false), 3000)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title={comissaoAtual > 0 ? `Atualizar comissão (${formatBRL(comissaoAtual)})` : 'Lançar comissão'}
        className="text-text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
      >
        {sucesso ? (
          <span className="text-green-400 text-xs">✓</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        )}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-4">
      <input type="hidden" name="barbeiro_id" value={barbeiro.id} />

      <div>
        <label className="label">Comissão do mês (R$)</label>
        <input
          name="comissao_acumulada"
          type="number"
          step="0.01"
          min="0"
          defaultValue={comissaoAtual || ''}
          placeholder="0,00"
          required
          className="input"
        />
        <p className="text-text-muted text-xs font-sans mt-1.5">
          Digite o total de comissão que esse barbeiro recebeu no mês.
        </p>
        {metaInd && (
          <p className="text-text-muted text-xs font-sans mt-1">
            Ouro: {formatBRL(metaInd.ouro_comm)} · Prata: {formatBRL(metaInd.prata_comm)} · Bronze: {formatBRL(metaInd.bronze_comm)}
          </p>
        )}
      </div>

      {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm py-2">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm py-2">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
