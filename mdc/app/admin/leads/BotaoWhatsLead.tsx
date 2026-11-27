'use client'

import BotaoWhatsapp from '@/components/admin/BotaoWhatsapp'
import { preencher, primeiroNome } from '@/lib/format'
import { marcarContatado } from './actions'

export default function BotaoWhatsLead({ id, nome, whatsapp, modelo }: { id?: string; nome: string; whatsapp: string; modelo: string }) {
  return (
    <BotaoWhatsapp
      whatsapp={whatsapp}
      mensagem={preencher(modelo, { nome: primeiroNome(nome), nome_completo: nome })}
      aoEnviar={id ? () => void marcarContatado(id) : undefined}
    />
  )
}
