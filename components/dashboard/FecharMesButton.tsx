'use client'

import { useState, useTransition } from 'react'
import { fecharMes, reabrirMes } from '@/app/dashboard/fechar-mes/actions'

interface Props {
  mes: number
  ano: number
  fechado: boolean
  variant?: 'fechar' | 'reabrir'  // visual; default deriva de fechado
}

/**
 * Botão de fechar/reabrir mês. Pequeno e usado dentro do banner do mês
 * passado (e do banner de "mês fechado"). Reabrir pede confirmação.
 */
export default function FecharMesButton({ mes, ano, fechado, variant }: Props) {
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const tipo = variant ?? (fechado ? 'reabrir' : 'fechar')

  function handleClick() {
    setErro(null)
    if (tipo === 'reabrir') {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Reabrir este mês? Edições voltam a ser permitidas.')
        : true
      if (!ok) return
    }
    startTransition(async () => {
      const res = tipo === 'fechar' ? await fecharMes(mes, ano) : await reabrirMes(mes, ano)
      if (res?.error) setErro(res.error)
    })
  }

  const label = tipo === 'fechar'
    ? (isPending ? 'Fechando…' : '🔒 Fechar este mês')
    : (isPending ? 'Reabrindo…' : 'Reabrir mês')

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={[
          'text-xs font-sans py-1.5 px-3 rounded-lg border transition-colors disabled:opacity-50',
          tipo === 'fechar'
            ? 'border-amber-500/40 text-amber-200 hover:bg-amber-500/10'
            : 'border-amber-500/40 text-amber-200 hover:bg-amber-500/10',
        ].join(' ')}
      >
        {label}
      </button>
      {erro && <span className="text-red-400 text-[11px] font-sans">{erro}</span>}
    </div>
  )
}
