// URL canônica do app. Prioridade:
// 1) NEXT_PUBLIC_APP_URL (configurado na Vercel)
// 2) Fallback hardcoded
//
// Resiliente: se a env var estiver setada com valor inválido (sem
// protocolo, lixo, etc.), cai pro fallback em vez de quebrar com
// TypeError em `new URL()` no SSR (que apaga a página inteira).

const FALLBACK = 'https://bussolameet.com.br'

function normalizar(raw: string | undefined): string {
  if (!raw) return FALLBACK
  const limpo = raw.trim().replace(/\/$/, '')
  if (!limpo) return FALLBACK
  // Aceita só http(s) com URL válida.
  try {
    const u = new URL(limpo)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return FALLBACK
    return limpo
  } catch {
    return FALLBACK
  }
}

export const APP_URL: string = normalizar(process.env.NEXT_PUBLIC_APP_URL)

// Versão que aceita um host como fallback secundário (útil em previews).
export function appUrlFromHost(host: string | null | undefined): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return APP_URL
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https'
    const candidato = `${proto}://${host}`
    try {
      new URL(candidato)
      return candidato
    } catch {
      return APP_URL
    }
  }
  return APP_URL
}
