'use client'

import { useState, useTransition } from 'react'
import { toggleTutorialAtivo } from './adminActions'

export default function ToggleAtivo({ id, ativo }: { id: string; ativo: boolean }) {
  const [on, setOn] = useState(ativo)
  const [isPending, startTransition] = useTransition()

  function alternar() {
    const novo = !on
    setOn(novo)
    startTransition(async () => {
      const r = await toggleTutorialAtivo(id, novo)
      if (r?.error) setOn(!novo)
    })
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={isPending}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-marrom' : 'bg-chumbo/40'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
