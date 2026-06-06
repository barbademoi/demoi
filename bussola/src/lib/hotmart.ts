// Tipos do payload Hotmart e helpers compartilhados pelo webhook e
// pela página /boas-vindas.

export type HotmartEvent =
  | 'PURCHASE_APPROVED'
  | 'PURCHASE_COMPLETE'
  | 'PURCHASE_REFUNDED'
  | 'PURCHASE_CANCELED'
  | 'PURCHASE_CHARGEBACK'
  | string

// Subset do payload — só os campos que usamos. Hotmart envia muito mais.
export interface HotmartWebhookPayload {
  event: HotmartEvent
  data: {
    buyer: {
      email: string
      name?: string
    }
    purchase: {
      transaction: string
      price?: {
        value?: number
        currency_value?: string
      }
      status?: string
    }
    product: {
      id: number | string
      name?: string
    }
  }
  hottok?: string
}

export type StatusCompra =
  | 'pending'
  | 'approved'
  | 'refunded'
  | 'failed'
  | 'canceled'

// Mapeia o evento Hotmart pro status interno de compras_hotmart.
export function statusDeEvento(event: HotmartEvent): StatusCompra | null {
  if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
    return 'approved'
  }
  if (event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_CHARGEBACK') {
    return 'refunded'
  }
  if (event === 'PURCHASE_CANCELED') {
    return 'canceled'
  }
  return null
}

// Senha aleatória temporária. 32 chars hex (16 bytes). Usuário troca em
// /boas-vindas — esse valor nunca é mostrado nem enviado.
export function gerarSenhaTemporaria(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}
