import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PublicBrindoletaOffer } from '@/lib/brindoleta/types'
import BrindoletaWheel from './BrindoletaWheel'

export const dynamic = 'force-dynamic'

type Props = { params: { codigo: string } }

type BarberPublic = {
  id: string
  nome: string
  foto_url: string | null
  barbearia_id: string
}

type BusinessPublic = {
  nome: string
  logo_url: string | null
}

async function getPublicData(codigo: string) {
  const code = codigo.trim().toLowerCase().slice(0, 40)
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barber } = await (admin as any)
    .from('barbeiros')
    .select('id, nome, foto_url, barbearia_id')
    .eq('link_codigo', code)
    .eq('ativo', true)
    .maybeSingle() as { data: BarberPublic | null }
  if (!barber) return null

  const [licenseResult, businessResult, offersResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('brindoleta_licenses').select('status').eq('barbearia_id', barber.barbearia_id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('barbearias').select('nome, logo_url').eq('id', barber.barbearia_id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('brindoleta_offers')
      .select('id, title, offer_type, color')
      .eq('barbearia_id', barber.barbearia_id)
      .eq('enabled', true)
      .gt('stock', 0)
      .order('created_at', { ascending: true })
      .limit(6),
  ])

  if (licenseResult.data?.status !== 'active' || !businessResult.data) return null
  return {
    barber,
    business: businessResult.data as BusinessPublic,
    offers: (offersResult.data ?? []) as PublicBrindoletaOffer[],
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicData(params.codigo)
  return {
    title: data ? `Roleta Premiada — ${data.business.nome}` : 'Brindoleta',
    description: 'Gire a roleta e descubra sua oferta especial.',
  }
}

export default async function PublicBrindoletaPage({ params }: Props) {
  const data = await getPublicData(params.codigo)
  if (!data) notFound()

  return (
    <BrindoletaWheel
      codigo={params.codigo}
      businessName={data.business.nome}
      businessLogo={data.business.logo_url}
      barberName={data.barber.nome}
      barberPhoto={data.barber.foto_url}
      initialOffers={data.offers}
    />
  )
}
