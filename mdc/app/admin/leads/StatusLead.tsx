'use client'

import { useState, useTransition } from 'react'
import { STATUS_LEAD } from '@/lib/opcoes'
import { mudarStatusLead } from './actions'

const COR: Record<string, string> = {
  novo: 'border-latao/60 text-latao',
  contatado: 'border-sky-400/50 text-sky-300',
  comprou: 'border-ok/60 text-ok',
  descartado: 'border-linha text-suave',
}

export default function StatusLead({ id, status }: { id: string; status: string }) {
  const [valor, setValor] = useState(status)
  const [pendente, iniciar] = useTransition()
  return (
    <select
      aria-label="Status do lead"
      value={valor}
      disabled={pendente}
      onChange={(e) => {
        const novo = e.target.value
        const antigo = valor
        setValor(novo)
        iniciar(async () => {
          try {
            await mudarStatusLead(id, novo)
          } catch {
            setValor(antigo)
            alert('Não deu pra mudar o status.')
          }
        })
      }}
      className={`min-h-[40px] rounded-xl border bg-card-2 px-3 text-sm font-semibold ${COR[valor] ?? ''}`}
    >
      {STATUS_LEAD.map((s) => (
        <option key={s.valor} value={s.valor}>{s.rotulo}</option>
      ))}
    </select>
  )
}
