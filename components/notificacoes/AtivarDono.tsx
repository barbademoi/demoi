'use client'

/**
 * O convite de notificações do DONO — só a amarração.
 *
 * O popup é genérico (`AtivarNotificacoes`); aqui mora a única diferença: de
 * quem é a inscrição, e por qual porta ela entra no servidor. Server action em
 * componente separado porque a chamada precisa de `'use client'` e a página do
 * dashboard é server component.
 */

import AtivarNotificacoes from './AtivarNotificacoes'
import { inscreverDono } from '@/app/notificacoes/actions'

export default function AtivarDono({ userId, chavePublica }: { userId: string; chavePublica: string }) {
  return (
    <AtivarNotificacoes
      papel="dono"
      id={userId}
      chavePublica={chavePublica}
      aoInscrever={async (d) => {
        const r = await inscreverDono(d)
        return r.error ?? null
      }}
    />
  )
}
