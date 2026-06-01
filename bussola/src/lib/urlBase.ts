// URL canônica do app. Prioridade:
// 1) NEXT_PUBLIC_APP_URL (configurado na Vercel — produção/preview/dev)
// 2) Fallback hardcoded pro domínio principal (não deixa nunca cair em string vazia)
//
// Use em todos os lugares que precisam gerar links externos (link do
// colaborador, link de feedback de cliente, QR code, OG tags, sitemap).
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://bussolameet.com.br'

// Versão que aceita um headers() como fallback secundário. Útil quando
// queremos respeitar o host atual em deploys preview da Vercel (onde o
// domínio canônico não bate). Se nenhuma variável estiver setada,
// volta pro fallback hardcoded.
export function appUrlFromHost(host: string | null | undefined): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return APP_URL
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  }
  return APP_URL
}
