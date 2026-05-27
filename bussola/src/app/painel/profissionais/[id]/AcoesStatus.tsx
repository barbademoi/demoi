'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { mudarStatus } from '../actions'
import type { StatusProfissional } from '@/lib/profissionais'

export default function AcoesStatus({
  id,
  nome,
  status,
}: {
  id: string
  nome: string
  status: StatusProfissional
}) {
  const router = useRouter()
  const [confirmarDesligar, setConfirmarDesligar] = useState(false)
  const [isPending, startTransition] = useTransition()

  function aplicar(novo: StatusProfissional) {
    startTransition(async () => {
      const res = await mudarStatus(id, novo)
      if (!res?.error) {
        setConfirmarDesligar(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status !== 'ativo' && (
          <button type="button" onClick={() => aplicar('ativo')} disabled={isPending} className="btn-secondary px-4 py-2 text-sm">
            Reativar
          </button>
        )}
        {status === 'ativo' && (
          <button type="button" onClick={() => aplicar('afastado')} disabled={isPending} className="btn-secondary px-4 py-2 text-sm">
            Afastar
          </button>
        )}
        {status !== 'desligado' && (
          <button
            type="button"
            onClick={() => setConfirmarDesligar(true)}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md border border-border text-vinho hover:bg-vinho/5 transition-colors"
          >
            Desligar
          </button>
        )}
      </div>

      {confirmarDesligar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmarDesligar(false)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Desligar {nome}?</h4>
            <p className="text-sm text-grafite mb-5">
              O link do profissional vai parar de funcionar e ele não terá mais acesso ao placar.
              Você pode reativar depois se quiser.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => aplicar('desligado')}
                disabled={isPending}
                className="btn-destrutivo flex-1"
              >
                {isPending ? 'Desligando…' : 'Sim, desligar'}
              </button>
              <button type="button" onClick={() => setConfirmarDesligar(false)} className="text-grafite hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
