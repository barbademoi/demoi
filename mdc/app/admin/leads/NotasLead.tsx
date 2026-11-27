'use client'

import { useState, useTransition } from 'react'
import { salvarNotasLead } from './actions'

export default function NotasLead({ id, notas }: { id: string; notas: string }) {
  const [aberto, setAberto] = useState(!!notas)
  const [valor, setValor] = useState(notas)
  const [salvo, setSalvo] = useState(notas)
  const [pendente, iniciar] = useTransition()

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="mt-3 text-sm text-suave hover:text-texto">
        + Anotação
      </button>
    )
  }
  return (
    <div className="mt-3">
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (valor === salvo) return
          iniciar(async () => {
            await salvarNotasLead(id, valor)
            setSalvo(valor)
          })
        }}
        rows={2}
        placeholder="Anotações (só o admin vê)"
        className="campo py-2.5 text-sm"
      />
      <p className="mt-1 text-xs text-suave">{pendente ? 'Salvando...' : valor === salvo ? 'Salvo' : 'Sai do campo pra salvar'}</p>
    </div>
  )
}
