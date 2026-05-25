'use client'

import { useState } from 'react'

interface Props {
  value: number
  onChange?: (v: number) => void
  max?: number
  size?: number
  readOnly?: boolean
}

export default function Estrelas({ value, onChange, max = 5, size = 28, readOnly = false }: Props) {
  const [hover, setHover] = useState(0)
  const editavel = !readOnly && !!onChange

  function clicar(n: number) {
    if (!editavel) return
    // Clicar na estrela já marcada limpa a nota (toggle).
    onChange!(value === n ? 0 : n)
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        const cheia = (hover || value) >= n
        return (
          <button
            key={n}
            type="button"
            disabled={!editavel}
            onClick={() => clicar(n)}
            onMouseEnter={() => editavel && setHover(n)}
            aria-label={`${n} de ${max}`}
            className={editavel ? 'cursor-pointer transition-transform active:scale-90' : 'cursor-default'}
            style={{ lineHeight: 1, fontSize: size, color: cheia ? '#F5B301' : '#D4D9E0' }}
          >
            {cheia ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
