export const SUPORTE = {
  whatsapp: '5535998248211',
  whatsappDisplay: '(35) 99824-8211',
  whatsappMensagem: 'Olá! Tenho uma dúvida sobre o BarberMeta.',
  email: 'suporte@barbermeta.com.br',
} as const

export function whatsappUrl(mensagem: string = SUPORTE.whatsappMensagem) {
  return `https://wa.me/${SUPORTE.whatsapp}?text=${encodeURIComponent(mensagem)}`
}
