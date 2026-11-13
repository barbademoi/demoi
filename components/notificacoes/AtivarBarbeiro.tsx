'use client'

/**
 * O convite de notificações do COLABORADOR — só a amarração.
 *
 * O barbeiro não tem conta: quem prova quem ele é, pro servidor, é o
 * `link_codigo` — o mesmo token que já dá acesso à tela dele.
 */

import AtivarNotificacoes from './AtivarNotificacoes'
import { inscreverBarbeiro } from '@/app/notificacoes/actions'

export default function AtivarBarbeiro({
  barbeiroId, linkCodigo, chavePublica,
}: { barbeiroId: string; linkCodigo: string; chavePublica: string }) {
  return (
    <AtivarNotificacoes
      papel="barbeiro"
      id={barbeiroId}
      chavePublica={chavePublica}
      aoInscrever={async (d) => {
        const r = await inscreverBarbeiro(linkCodigo, d)
        return r.error ?? null
      }}
    />
  )
}
