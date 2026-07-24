// Meta Pixel (Facebook Pixel) helpers.
// Uso: importa e chama trackPageView / trackInitiateCheckout / trackLead
// nos pontos onde o evento deve disparar. O componente MetaPixel monta
// o snippet base uma vez no <head> (via app/layout.tsx).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '415652621143755'

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  // eventID permite deduplicar este evento do browser com um mesmo
  // evento enviado via CAPI (server-side), quando/se for adicionado depois.
  const opts = eventId ? { eventID: eventId } : undefined
  if (opts) window.fbq('track', event, params ?? {}, opts)
  else if (params) window.fbq('track', event, params)
  else window.fbq('track', event)
}

export function trackPageView(eventId?: string) {
  track('PageView', undefined, eventId)
}

export function trackViewContent(content_name: string) {
  track('ViewContent', { content_name })
}

export function trackInitiateCheckout(value: number, currency = 'BRL') {
  track('InitiateCheckout', { value, currency })
}

export function trackLead() {
  track('Lead')
}

// Evento PERSONALIZADO (trackCustom) — não é evento padrão de compra.
// Usado no botão secundário de WhatsApp do hero pra medir cliques de contato.
function trackCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  if (params) window.fbq('trackCustom', event, params)
  else window.fbq('trackCustom', event)
}

export function trackContatoWhatsApp() {
  trackCustom('Contato_WhatsApp')
}

export function trackPlayVideoHero() {
  trackCustom('Play_Video_Hero')
}
