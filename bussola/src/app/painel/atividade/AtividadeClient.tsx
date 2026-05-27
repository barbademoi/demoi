'use client'

import { useState } from 'react'
import AtividadeItem, { type AtividadeFb } from '@/components/AtividadeItem'
import { intervalo, type NomePeriodo } from '@/lib/periodos'

export interface ItemAtividade extends AtividadeFb {
  profissional_id: string | null
}

type FiltroTipo = 'todos' | 'leu' | 'respondeu'
type FiltroPeriodo = 'tudo' | NomePeriodo

export default function AtividadeClient({
  itens,
  ativos,
}: {
  itens: ItemAtividade[]
  ativos: { id: string; nome: string }[]
}) {
  const [tipo, setTipo] = useState<FiltroTipo>('todos')
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('tudo')
  const [profId, setProfId] = useState<string>('todos')

  const lista = itens.filter((a) => {
    if (tipo === 'respondeu' && !a.resposta_profissional) return false
    if (tipo === 'leu' && a.resposta_profissional) return false
    if (profId !== 'todos' && a.profissional_id !== profId) return false
    if (periodo !== 'tudo') {
      const { inicio, fim } = intervalo(periodo)
      const t = Date.parse(a.resposta_em ?? a.lido_em ?? '0') || 0
      if (t < inicio.getTime() || t > fim.getTime()) return false
    }
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {([['todos', 'Todos'], ['leu', 'Leram'], ['respondeu', 'Responderam']] as [FiltroTipo, string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setTipo(v)}
            className={['px-3 py-1 rounded-full text-xs font-medium border', tipo === v ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted'].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {([['tudo', 'Tudo'], ['semana', 'Semana'], ['mes', 'Mês']] as [FiltroPeriodo, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setPeriodo(v)}
              className={['px-3 py-1 rounded-full text-xs font-medium border', periodo === v ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted'].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <select value={profId} onChange={(e) => setProfId(e.target.value)} className="text-xs rounded-lg border border-border bg-white px-2 py-1.5 text-text">
          <option value="todos">Todos profissionais</option>
          {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {lista.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">Nenhuma atividade nesse filtro.</p>
      ) : (
        <div className="space-y-2">
          {lista.map((a) => <AtividadeItem key={a.id} a={a} />)}
        </div>
      )}
    </div>
  )
}
