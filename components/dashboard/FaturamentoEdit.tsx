'use client'

import { useState, useTransition } from 'react'
import { atualizarFaturamento } from '@/app/dashboard/actions'
import { formatBRL } from '@/lib/utils'

interface Props {
  metaId: string
  faturamentoAtual: number
  metaColetiva: number
  mes: number
  ano: number
}

export default function FaturamentoEdit({ metaId, faturamentoAtual, metaColetiva, mes, ano }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(faturamentoAtual || ''))
  const [isPending, startTransition] = useTransition()

  function salvar() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('meta_id', metaId)
      fd.set('faturamento_acumulado', valor)
      fd.set('mes', String(mes))
      fd.set('ano', String(ano))
      await atualizarFaturamento(fd)
      setEditando(false)
    })
  }

  if (editando) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="text-text-muted text-sm font-sans">Faturamento:</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          onChange={e => setValor(e.target.value)}
          autoFocus
          className="input py-1 text-sm w-36"
          onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false) }}
        />
        <button onClick={salvar} disabled={isPending} className="btn-primary text-xs py-1 px-3">
          {isPending ? '…' : 'OK'}
        </button>
        <button onClick={() => setEditando(false)} className="btn-ghost text-xs py-1 px-2">×</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-text-muted text-sm font-sans">
        Faturamento: <span className="text-text font-semibold">{faturamentoAtual > 0 ? formatBRL(faturamentoAtual) : 'não informado'}</span>
      </span>
      <button
        onClick={() => setEditando(true)}
        className="text-xs text-primary hover:text-primary font-sans underline"
      >
        editar
      </button>
    </div>
  )
}
