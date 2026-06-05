'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props<T> {
  items: T[]
  initialCount?: number
  renderItem: (item: T, index: number) => ReactNode
  // Quando true, ignora o limite e mostra tudo (uso típico: filtros ativos).
  alwaysExpanded?: boolean
  showMoreLabel?: (remaining: number) => string
  showLessLabel?: string
  className?: string
}

// Wrapper de listas longas: mostra os N primeiros itens e revela o restante
// via botão "Ver mais X". Reutilizável em qualquer lista de cards.
export function ListExpander<T>({
  items,
  initialCount = 5,
  renderItem,
  alwaysExpanded = false,
  showMoreLabel,
  showLessLabel = 'Recolher',
  className = 'space-y-3',
}: Props<T>) {
  const [expanded, setExpanded] = useState(false)
  const fullList = alwaysExpanded || expanded
  const visible = fullList ? items : items.slice(0, initialCount)
  const remaining = items.length - initialCount

  return (
    <div className={className}>
      {visible.map((item, i) => (
        <div key={i}>{renderItem(item, i)}</div>
      ))}

      {!alwaysExpanded && items.length > initialCount && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-3 text-marrom border border-marrom/20 rounded-lg hover:bg-marrom/5 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              {showLessLabel}
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {showMoreLabel ? showMoreLabel(remaining) : `Ver mais ${remaining}`}
            </>
          )}
        </button>
      )}
    </div>
  )
}
