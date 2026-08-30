// Meta Pixel (Facebook Pixel) helpers.
// O carregamento fica centralizado aqui para que eventos disparados logo
// apos a hidratacao sejam enfileirados mesmo antes do script externo terminar.

type MetaPixelFunction = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: MetaPixelFunction
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: MetaPixelFunction
    _fbq?: MetaPixelFunction
    __metaPixelInitialized?: Record<string, boolean>
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '415652621143755'

const META_PIXEL_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js'

export function initializeMetaPixel() {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return

  if (typeof window.fbq !== 'function') {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as MetaPixelFunction

    fbq.queue = []
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'

    window.fbq = fbq
    window._fbq = fbq
  }

  if (!document.querySelector(`script[src="${META_PIXEL_SCRIPT_URL}"]`)) {
    const script = document.createElement('script')
    script.id = 'meta-pixel-library'
    script.async = true
    script.src = META_PIXEL_SCRIPT_URL
    document.head.appendChild(script)
  }

  window.__metaPixelInitialized ??= {}
  if (!window.__metaPixelInitialized[META_PIXEL_ID]) {
    window.fbq('init', META_PIXEL_ID)
    window.__metaPixelInitialized[META_PIXEL_ID] = true
  }
}

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined') return
  initializeMetaPixel()
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

/**
 * `anual_unico` é a oferta pública atual: pagamento único de 1 ano.
 * `mensal` e `anual` são a assinatura recorrente, que saiu da página mas
 * continua viva pra quem já assina — os eventos delas seguem existindo.
 */
export type BarberMetaPlan = 'mensal' | 'anual' | 'anual_unico'

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bm-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return undefined
  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined
}

export function trackAddToCart(plan: BarberMetaPlan, value: number, currency = 'BRL') {
  if (typeof window === 'undefined') return

  const eventId = createEventId()
  const planLabel = plan === 'anual_unico'
    ? 'Acesso anual (pagamento único)'
    : plan === 'anual' ? 'Plano anual' : 'Plano mensal'
  const customData = {
    value,
    currency,
    content_name: `BarberMeta - ${planLabel}`,
    content_ids: [`barbermeta-${plan}`],
    content_type: 'product',
  }

  track('AddToCart', customData, eventId)

  void fetch('/api/meta/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'AddToCart',
      eventId,
      plan,
      sourceUrl: window.location.href,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
    }),
    keepalive: true,
  }).catch(() => {
    // O rastreamento pelo Pixel continua valido se a API estiver indisponivel.
  })
}

export function trackLead() {
  track('Lead')
}

// Evento PERSONALIZADO (trackCustom) — não é evento padrão de compra.
// Usado no botão secundário de WhatsApp do hero pra medir cliques de contato.
function trackCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  initializeMetaPixel()
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

export function trackPlayVideoHeroSom() {
  trackCustom('Play_Video_Hero_Som')
}
