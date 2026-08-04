export const BRINDOLETA_PRICE_CENTS = 4700
export const BRINDOLETA_PRICE_LABEL = 'R$ 47,00'
const DEFAULT_PIX_PAYMENT_URL = 'https://nubank.com.br/cobrar/93zx7/6a721acd-a7a1-4c68-8690-d0dede38e78b'

export type BrindoletaStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export function brindoletaPaymentConfig() {
  return {
    pixKey: (process.env.BRINDOLETA_PIX_KEY ?? '').trim(),
    pixReceiver: (process.env.BRINDOLETA_PIX_RECEIVER ?? '').trim(),
    pixQrImageUrl: (process.env.BRINDOLETA_PIX_QR_IMAGE_URL ?? '').trim(),
    pixPaymentUrl: (process.env.BRINDOLETA_PIX_PAYMENT_URL ?? DEFAULT_PIX_PAYMENT_URL).trim(),
  }
}
