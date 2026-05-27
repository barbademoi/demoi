'use client'

import { useState } from 'react'
import FeedbackItem from '@/components/FeedbackItem'
import { CATEGORIAS, type FeedbackComProfissional, type TipoFeedback } from '@/lib/feedbacks'
import { intervalo, type NomePeriodo } from '@/lib/periodos'

type FiltroTipo = 'todos' | TipoFeedback
type FiltroPeriodo = 'tudo' | NomePeriodo

const TIPO_PILLS: { valor: FiltroTipo; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'positivo', label: 'Positivos' },
  { valor: 'negativo', label: 'Negativos' },
  { valor: 'observacao', label: 'Observações' },
]

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
  const [tipo, setTipo] = useState<FiltroTipo>('todos')
  const [categoria, setCategoria] = useState<string>('todas')
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('tudo')
  const [leitura, setLeitura] = useState<'todos' | 'lidos' | 'respondidos'>('todos')

  const lista = feedbacks.filter((f) => {
    if (tipo !== 'todos' && f.tipo !== tipo) return false
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

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {TIPO_PILLS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => setTipo(p.valor)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              tipo === p.valor ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {([['todos', 'Todos'], ['lidos', 'Lidos'], ['respondidos', 'Respondidos']] as ['todos' | 'lidos' | 'respondidos', string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setLeitura(v)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              leitura === v ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {PERIODO_PILLS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPeriodo(p.valor)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                periodo === p.valor ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="text-xs rounded-lg border border-border bg-white px-2 py-1.5 text-text"
        >
          <option value="todas">Todas categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {lista.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">
          {feedbacks.length === 0
            ? `Nenhum feedback registrado ainda para ${nome}.`
            : 'Nenhum feedback nesse filtro.'}
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
