/**
 * Tarefix como módulo extra do BarberMeta: pagamento único de R$ 47,00, pelo
 * MESMO Pix da Brindoleta (o admin confere no banco e libera).
 */
export { brindoletaPaymentConfig as tarefixPaymentConfig } from '@/lib/brindoleta/config'

export const TAREFIX_PRICE_CENTS = 4700
export const TAREFIX_PRICE_LABEL = 'R$ 47,00'

export type TarefixLicencaStatus = 'pending' | 'active' | 'rejected' | 'suspended'

/** WhatsApp só com dígitos; aceita com ou sem DDI (55). */
export function limparWhatsapp(v: string): string | null {
  const d = v.replace(/\D/g, '')
  if (d.length < 10 || d.length > 13) return null
  return d
}
