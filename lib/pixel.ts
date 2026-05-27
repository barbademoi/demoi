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
  // eventID permite que a Meta deduplique este evento do browser com o mesmo
  // evento enviado via CAPI (server-side).
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
