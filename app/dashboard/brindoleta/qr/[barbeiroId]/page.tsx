import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailPodeBrindoleta } from '@/lib/brindoleta/acesso'
import QrPrintCard from './QrPrintCard'

export const metadata = { title: 'Imprimir QR Code — Brindoleta' }
export const dynamic = 'force-dynamic'

type Props = { params: { barbeiroId: string } }

type Owner = {
  barbearia_id: string
  barbearias: { nome: string; logo_url: string | null } | null
}

export default async function BrindoletaQrPrintPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Em teste: só a conta liberada acessa a Brindoleta.
  if (!emailPodeBrindoleta(user.email)) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, logo_url)')
    .eq('id', user.id)
    .single()
  const owner = ownerRaw as unknown as Owner | null
  if (!owner?.barbearia_id || !owner.barbearias) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: license } = await (supabase as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', owner.barbearia_id)
    .maybeSingle()
  if (license?.status !== 'active') redirect('/dashboard/brindoleta')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barber } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, foto_url, link_codigo')
    .eq('id', params.barbeiroId)
    .eq('barbearia_id', owner.barbearia_id)
    .eq('ativo', true)
    .maybeSingle() as { data: { id: string; nome: string; foto_url: string | null; link_codigo: string } | null }
  if (!barber) notFound()

  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  if (!host) notFound()
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const publicUrl = `${protocol}://${host}/brindoleta/${barber.link_codigo}`

  return (
    <QrPrintCard
      businessName={owner.barbearias.nome}
      businessLogo={owner.barbearias.logo_url}
      barberName={barber.nome}
      barberPhoto={barber.foto_url}
      publicUrl={publicUrl}
    />
  )
}
