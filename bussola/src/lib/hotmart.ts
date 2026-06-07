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

// Normaliza payload Hotmart pra estrutura v2 (HotmartWebhookPayload).
// A Hotmart envia em 2 formatos:
//   v1 (descontinuado): campos flat - { transaction, email, prod, status, hottok, name, full_price, ... }
//   v2 (atual):         JSON aninhado - { event, data: { buyer, purchase, product } }
// Aceita ambos e converte v1 → v2 transparente.
// Retorna null se não conseguir identificar.
export function normalizarPayload(raw: unknown): HotmartWebhookPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  // v2: já tem campo `data` aninhado
  if (obj.data && typeof obj.data === 'object') {
    return raw as HotmartWebhookPayload
  }

  // v1: campos flat com `transaction` e `email`
  if (typeof obj.transaction === 'string' && typeof obj.email === 'string') {
    return v1ParaV2(obj)
  }

  return null
}

function v1ParaV2(v1: Record<string, unknown>): HotmartWebhookPayload {
  const statusStr = String(v1.status ?? '').toLowerCase()
  let event: HotmartEvent = 'UNKNOWN'
  if (statusStr === 'approved' || statusStr === 'complete') event = 'PURCHASE_APPROVED'
  else if (statusStr === 'refunded') event = 'PURCHASE_REFUNDED'
  else if (statusStr === 'canceled' || statusStr === 'cancelled') event = 'PURCHASE_CANCELED'
  else if (statusStr === 'chargeback') event = 'PURCHASE_CHARGEBACK'

  // price/full_price pode vir como número ou string
  const parsePreco = (v: unknown): number | undefined => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(',', '.'))
      return Number.isFinite(n) ? n : undefined
    }
    return undefined
  }
  const valor = parsePreco(v1.full_price) ?? parsePreco(v1.price)

  return {
    event,
    data: {
      buyer: {
        email: String(v1.email),
        name: typeof v1.name === 'string' ? v1.name : undefined,
      },
      product: {
        id: (typeof v1.prod === 'string' || typeof v1.prod === 'number')
          ? v1.prod
          : '',
        name: typeof v1.prod_name === 'string' ? v1.prod_name : undefined,
      },
      purchase: {
        transaction: String(v1.transaction),
        price: valor !== undefined
          ? {
              value: valor,
              currency_value: typeof v1.currency === 'string' ? v1.currency : 'BRL',
            }
          : undefined,
        status: statusStr,
      },
    },
    hottok: typeof v1.hottok === 'string' ? v1.hottok : undefined,
  }
}
