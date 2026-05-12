'use client'

import { useTransition } from 'react'
import { toggleCampanhaAtivo } from '@/app/dashboard/campanha/actions'

interface Props {
  campanhaId: string
  ativo: boolean
}

export default function CampanhaToggle({ campanhaId, ativo }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleCampanhaAtivo(campanhaId, !ativo)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={ativo ? 'Clique para desativar a campanha' : 'Clique para ativar a campanha'}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-sans font-semibold transition-all
        ${ativo
          ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
          : 'bg-surface-2 border-border text-text-muted hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'}`}
    >
      <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-green-400' : 'bg-text-muted'} ${isPending ? 'opacity-50' : ''}`} />
      {isPending ? 'Salvando…' : ativo ? 'Campanha ativa' : 'Campanha inativa'}
    </button>
  )
}
