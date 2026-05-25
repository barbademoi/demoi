import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/lib/meta-capi'

// Endpoint first-party chamado pelo RouteTracker do pixel. Por ser do próprio
// domínio, sobrevive ao bloqueio do ITP/ad blocker que barra o connect.facebook.net.
// Daqui o evento sai server-side pra Meta CAPI.
export async function POST(request: NextRequest) {
  try {
    const { eventId, eventSourceUrl } = await request.json()
    if (!eventId || typeof eventId !== 'string') {
      return new NextResponse(null, { status: 204 })
    }

    const userAgent = request.headers.get('user-agent') ?? undefined
    const fwd = request.headers.get('x-forwarded-for') ?? ''
    const clientIp =
      fwd.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined

    await sendMetaEvent({
      eventName: 'PageView',
      eventId,
      eventSourceUrl: typeof eventSourceUrl === 'string' ? eventSourceUrl : undefined,
      userAgent,
      clientIp: clientIp ?? undefined,
      fbp: request.cookies.get('_fbp')?.value,
      fbc: request.cookies.get('_fbc')?.value,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    // Nunca quebra o cliente — rastreamento é best-effort.
    return new NextResponse(null, { status: 204 })
  }
}
