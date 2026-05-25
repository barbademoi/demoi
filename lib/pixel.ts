declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '415652621143755'

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') {
    // eslint-disable-next-line no-console
    console.log('[pixel] track() abortado — window.fbq indisponível', { event })
    return
  }
  // eslint-disable-next-line no-console
  console.log('[pixel] disparando fbq track', { event, params })
  if (params) window.fbq('track', event, params)
  else window.fbq('track', event)
}

export function trackPageView() {
  track('PageView')
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
