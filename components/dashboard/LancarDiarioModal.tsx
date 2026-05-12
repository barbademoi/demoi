'use client'

import { useState, useTransition } from 'react'
import { salvarLancamentosDiarios } from '@/app/dashboard/lancamento-diario/actions'
import { formatBRL } from '@/lib/utils'
import type { Barbeiro } from '@/types/database'

interface BarbeiroComHoje extends Barbeiro {
  valorHoje: number
}

interface Props {
  barbeiros: BarbeiroComHoje[]
  dataHoje: string          // 'YYYY-MM-DD'
  labelHoje: string         // ex: "8 de maio"
}

export default function LancarDiarioModal({ barbeiros, dataHoje, labelHoje }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, b.valorHoje > 0 ? String(b.valorHoje) : '']))
  )

  function handleChange(id: string, raw: string) {
    setValores(v => ({ ...v, [id]: raw }))
  }

  function salvar() {
    setErro(null)
    setSucesso(false)
    const lancamentos = barbeiros.map(b => ({
      barbeiro_id: b.id,
      valor: parseFloat(valores[b.id] || '0') || 0,
    }))

    startTransition(async () => {
      const res = await salvarLancamentosDiarios(lancamentos, dataHoje)
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      setTimeout(() => { setSucesso(false); setOpen(false) }, 900)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
      >
        📅 Lançar dia de hoje
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-xl text-text">Lançamento diário</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">{labelHoje}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          <p className="text-text-muted text-xs font-sans">Faturamento de hoje por barbeiro. Preencha apenas quem trabalhou.</p>

          {barbeiros.map(b => (
            <div key={b.id} className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center font-serif text-base text-text-muted shrink-0 overflow-hidden">
                {b.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                ) : b.nome[0]}
              </div>
              <p className="font-sans text-sm text-text flex-1 min-w-0 truncate">{b.nome}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-text-muted text-sm font-sans">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={valores[b.id]}
                  onChange={e => handleChange(b.id, e.target.value)}
                  className="input w-28 py-1.5 text-sm text-right"
                />
              </div>
            </div>
          ))}

          {erro && <p className="text-red-400 text-sm font-sans pt-1">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
          <button onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm py-2.5">Cancelar</button>
          <button onClick={salvar} disabled={isPending || sucesso} className="btn-primary flex-1 text-sm py-2.5">
            {sucesso ? '✓ Salvo!' : isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
