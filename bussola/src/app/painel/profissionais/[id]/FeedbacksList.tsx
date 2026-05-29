'use client'

import { useState } from 'react'
import FeedbackItem from '@/components/FeedbackItem'
import { CATEGORIAS, type FeedbackComProfissional } from '@/lib/feedbacks'
import { intervalo, type NomePeriodo } from '@/lib/periodos'

type FiltroPeriodo = 'tudo' | NomePeriodo

const PERIODO_PILLS: { valor: FiltroPeriodo; label: string }[] = [
  { valor: 'semana', label: 'Esta semana' },
  { valor: 'mes', label: 'Este mês' },
  { valor: 'tudo', label: 'Tudo' },
]

export default function FeedbacksList({
  feedbacks,
  nome,
}: {
  feedbacks: FeedbackComProfissional[]
  nome: string
}) {
  const [categoria, setCategoria] = useState<string>('todas')
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('tudo')
  const [leitura, setLeitura] = useState<'todos' | 'lidos' | 'respondidos'>('todos')

  const lista = feedbacks.filter((f) => {
    if (categoria !== 'todas' && f.categoria !== categoria) return false
    if (leitura === 'lidos' && !f.lido_em) return false
    if (leitura === 'respondidos' && !f.resposta_profissional) return false
    if (periodo !== 'tudo') {
      const { inicio, fim } = intervalo(periodo)
      const t = new Date(f.created_at).getTime()
      if (t < inicio.getTime() || t > fim.getTime()) return false
    }
    return true
  })

  const pillCls = (on: boolean) =>
    [
      'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
      on ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-grafite',
    ].join(' ')

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {([['todos', 'Todos'], ['lidos', 'Lidos'], ['respondidos', 'Respondidos']] as ['todos' | 'lidos' | 'respondidos', string][]).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setLeitura(v)} className={pillCls(leitura === v)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {PERIODO_PILLS.map((p) => (
            <button key={p.valor} type="button" onClick={() => setPeriodo(p.valor)} className={pillCls(periodo === p.valor)}>
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="text-xs rounded-md border border-border bg-white px-2 py-1.5 text-text"
        >
          <option value="todas">Todas categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {lista.length === 0 ? (
        <p className="text-chumbo text-sm text-center py-8">
          {feedbacks.length === 0
            ? `Nenhuma observação registrada ainda para ${nome}.`
            : 'Nenhuma observação nesse filtro.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((f) => (
            <FeedbackItem key={f.id} feedback={f} variante="perfil" />
          ))}
        </div>
      )}
    </div>
  )
}
