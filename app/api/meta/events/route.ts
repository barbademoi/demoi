import { NextRequest, NextResponse } from 'next/server'
import { PRECO_ANUAL, PRECO_MENSAL } from '@/lib/checkout'

export const runtime = 'nodejs'

type Plan = 'mensal' | 'anual'

type MetaEventRequest = {
  eventName?: unknown
  eventId?: unknown
  plan?: unknown
  sourceUrl?: unknown
  fbp?: unknown
  fbc?: unknown
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '415652621143755'
const configuredVersion = process.env.META_CONVERSIONS_API_VERSION
const API_VERSION = configuredVersion && /^v\d+\.\d+$/.test(configuredVersion)
  ? configuredVersion
  : 'v25.0'

function isPlan(value: unknown): value is Plan {
  return value === 'mensal' || value === 'anual'
}

function cleanMetaCookie(value: unknown) {
  return typeof value === 'string' && value.length <= 255 ? value : undefined
}

function getSourceUrl(request: NextRequest, sourceUrl: unknown) {
  const fallback = request.headers.get('referer') || new URL('/', request.url).toString()
  if (typeof sourceUrl !== 'string') return fallback

  try {
    const parsed = new URL(sourceUrl)
    return parsed.host === request.nextUrl.host ? parsed.toString() : fallback
  } catch {
    return fallback
  }
}

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return NextResponse.json({ ok: false, error: 'Origem invalida.' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ ok: false, error: 'Origem invalida.' }, { status: 403 })
    }
  }

  let body: MetaEventRequest
  try {
    body = await request.json() as MetaEventRequest
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON invalido.' }, { status: 400 })
  }

  if (
    body.eventName !== 'AddToCart'
    || !isPlan(body.plan)
    || typeof body.eventId !== 'string'
    || body.eventId.length < 8
    || body.eventId.length > 100
  ) {
    return NextResponse.json({ ok: false, error: 'Evento invalido.' }, { status: 400 })
  }

  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Conversions API nao configurada.' },
      { status: 503 },
    )
  }

  const isAnnual = body.plan === 'anual'
  const value = isAnnual ? PRECO_ANUAL : PRECO_MENSAL
  const planLabel = isAnnual ? 'Plano anual' : 'Plano mensal'
  const userData = {
    client_ip_address: getClientIp(request),
    client_user_agent: request.headers.get('user-agent') || undefined,
    fbp: cleanMetaCookie(body.fbp),
    fbc: cleanMetaCookie(body.fbc),
  }

  const payload: Record<string, unknown> = {
    data: [{
      event_name: 'AddToCart',
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.eventId,
      action_source: 'website',
      event_source_url: getSourceUrl(request, body.sourceUrl),
      user_data: Object.fromEntries(
        Object.entries(userData).filter(([, value]) => Boolean(value)),
      ),
      custom_data: {
        value,
        currency: 'BRL',
        content_name: `BarberMeta - ${planLabel}`,
        content_ids: [`barbermeta-${body.plan}`],
        content_type: 'product',
      },
    }],
  }

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    )
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      console.error('[Meta CAPI] envio recusado:', response.status, result)
      return NextResponse.json(
        { ok: false, error: 'Falha ao enviar evento para a Meta.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, received: result?.events_received ?? 1 })
  } catch (error) {
    console.error('[Meta CAPI] erro de conexao:', error)
    return NextResponse.json(
      { ok: false, error: 'Falha de conexao com a Meta.' },
      { status: 502 },
    )
  }
}
