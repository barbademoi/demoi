'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recusarPagamento } from '../actions'

export default function BotaoRecusar({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return (
    <button
      type="button"
      disabled={pendente}
      className="mt-3 text-sm text-perigo underline"
      onClick={() => {
        const motivo = prompt('Por que recusar? (ex.: comprovante ilegível, valor errado)')
        if (motivo === null) return
        iniciar(async () => {
          const r = await recusarPagamento(paymentId, motivo)
          if (!r.ok) alert(r.erro)
          router.refresh()
        })
      }}
    >
      Recusar comprovante
    </button>
  )
}
