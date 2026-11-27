'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PLANOS } from '@/lib/planos'
import { trocarPlano } from './actions'

export default function TrocarPlano({ atual }: { atual: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Plano">
      {PLANOS.map((p) => {
        const ativo = p.id === atual
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={pendente}
            onClick={() =>
              !ativo &&
              iniciar(async () => {
                await trocarPlano(p.id)
                router.refresh()
              })
            }
            className={`chip justify-between ${ativo ? 'chip-ativo' : ''}`}
          >
            <span className="font-semibold">{p.nome}</span>
            <span className="text-sm text-suave">{p.destaque}</span>
          </button>
        )
      })}
    </div>
  )
}
