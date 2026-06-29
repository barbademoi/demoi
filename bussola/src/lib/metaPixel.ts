// Helper compartilhado pra disparar eventos do Meta Pixel.
// Best-effort: se o pixel não carregou (ad-blocker, slow network), não
// quebra a navegação. Os 3 CTAs da landing (CtaCompra, StickyMobileCta,
// LandingHeader) usam isso pra disparar InitiateCheckout no click.

interface FbqWindow extends Window {
  fbq?: (...args: unknown[]) => void
}

export function trackInitiateCheckout(): void {
  if (typeof window === 'undefined') return
  const w = window as FbqWindow
  if (typeof w.fbq !== 'function') return
  try {
    w.fbq('track', 'InitiateCheckout', {
      value: 97,
      currency: 'BRL',
      content_name: 'Bússola - acesso anual',
    })
  } catch {
    /* ignore */
  }
}
