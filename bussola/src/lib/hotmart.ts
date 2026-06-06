// Tipos do payload Hotmart e helpers compartilhados pelo webhook e
// pelas telas /entrar e /esqueci-senha.

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

// Senha temporária legível pra mostrar na tela. 8 chars sem caracteres
// confundíveis (0/O/1/l/I) e sem símbolos. Cliente troca por uma definitiva
// logo após o primeiro login (forçado pelo middleware).
export function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(arr[i] % chars.length)
  }
  return senha
}
