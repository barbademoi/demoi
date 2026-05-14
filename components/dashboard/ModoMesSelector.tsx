'use client'

import { useState, useTransition } from 'react'
import { salvarModoMes } from '@/app/dashboard/campanha/actions'
import type { ModoPontos } from '@/types/database'

interface Props {
  modoAtual: ModoPontos
  mes: number
  ano: number
}

const MODOS: { id: ModoPontos; label: string; desc: string }[] = [
  { id: 'metas',  label: 'Só Metas',      desc: 'Bronze / Prata / Ouro' },
  { id: 'pontos', label: 'Só Pontuação',  desc: 'Ranking por pontos' },
  { id: 'ambos',  label: 'Metas + Pontos', desc: 'Os dois juntos' },
]

export default function ModoMesSelector({ modoAtual, mes, ano }: Props) {
  const [modo, setModo] = useState<ModoPontos>(modoAtual)
  const [isPending, startTransition] = useTransition()

  function handleChange(novoModo: ModoPontos) {
    if (novoModo === modo) return
    setModo(novoModo)
    startTransition(async () => {
      await salvarModoMes(novoModo, mes, ano)
    })
  }

  return (
    <div className="card p-4">
      <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-3">
        Modo do mês {isPending && <span className="opacity-50">· salvando…</span>}
      </p>
      <div className="flex gap-2">
        {MODOS.map(m => (
          <button
            key={m.id}
            onClick={() => handleChange(m.id)}
            disabled={isPending}
            title={m.desc}
            className={`flex-1 py-2.5 rounded-xl text-xs font-sans font-semibold transition-all
              ${modo === m.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface-2 text-text-muted hover:text-text'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
