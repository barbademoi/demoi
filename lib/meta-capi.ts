// Meta Conversions API (CAPI) — envio server-side de eventos.
// Complementa o pixel do navegador: como ITP do Safari e ad blockers barram
// o fbevents.js (connect.facebook.net), o PageView do browser pode nunca
// disparar. Mandando o mesmo evento pelo servidor (com event_id igual),
// o PageView para de depender do navegador. A Meta deduplica browser + CAPI
// pelo par (event_name, event_id).

import { META_PIXEL_ID } from './pixel'

const CAPI_VERSION = 'v21.0'

interface SendArgs {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  userAgent?: string
  clientIp?: string
  fbp?: string
  fbc?: string
}

export async function sendMetaEvent({
  eventName, eventId, eventSourceUrl, userAgent, clientIp, fbp, fbc,
}: SendArgs): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN
  // Sem token configurado → no-op silencioso (não quebra nada).
  if (!token) return

  // user_data precisa de ao menos um identificador. IP + user agent já bastam;
  // fbp/fbc (cookies do pixel) melhoram o match quando presentes. Nenhum desses
  // campos é PII que exige hash — vão em texto puro, conforme a doc da Meta.
  const userData: Record<string, unknown> = {}
  if (clientIp) userData.client_ip_address = clientIp
  if (userAgent) userData.client_user_agent = userAgent
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        user_data: userData,
      },
    ],
  }

  const url = `https://graph.facebook.com/${CAPI_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[meta-capi] resposta não-OK', res.status, txt.slice(0, 500))
    }
  } catch (err) {
    console.error('[meta-capi] erro ao enviar evento', err)
  }
}
