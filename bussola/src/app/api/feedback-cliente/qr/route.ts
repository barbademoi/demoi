import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/utils/supabase/server'
import { appUrlFromHost } from '@/lib/urlBase'

// Gera o QR Code do link público da empresa em PNG. Só dono autenticado da
// empresa pode baixar.
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('link_feedback_cliente_slug, feedback_cliente_ativo')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est?.link_feedback_cliente_slug || !est.feedback_cliente_ativo) {
    return new NextResponse('Slug indisponível', { status: 404 })
  }

  const reqUrl = new URL(req.url)
  const base = appUrlFromHost(reqUrl.host)
  const alvo = `${base}/c/${est.link_feedback_cliente_slug}`

  const png = await QRCode.toBuffer(alvo, {
    type: 'png',
    margin: 2,
    width: 720,
    color: { dark: '#0F0F0F', light: '#FFFFFF' },
  })

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="bussola-feedback-cliente.png"',
      'Cache-Control': 'no-store',
    },
  })
}
