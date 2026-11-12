'use client'

import { useState } from 'react'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'

/** Sai da conta (a sessão é a mesma do BarberMeta: sai dos dois). */
export function BotaoSair({ className = 'tf-botao2', rotulo = 'Sair' }: { className?: string; rotulo?: string }) {
  const [saindo, setSaindo] = useState(false)
  return (
    <button
      type="button"
      className={className}
      disabled={saindo}
      onClick={async () => {
        setSaindo(true)
        await createTarefixClient().auth.signOut()
        window.location.href = '/tarefix/entrar'
      }}
    >
      {saindo ? 'Saindo…' : rotulo}
    </button>
  )
}
