// URL de checkout do Hotmart. Vem da env NEXT_PUBLIC_HOTMART_URL,
// configurável na Vercel. Se vazia, o botão fica como mailto de espera
// ou link âncora pra não quebrar a UX.
export const HOTMART_URL: string =
  process.env.NEXT_PUBLIC_HOTMART_URL?.trim() || '#oferta'

export const TEXTO_CTA_COMPRA = 'Quero garantir minha vaga por R$ 97'
