import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { brindoletaLiberada } from '@/lib/brindoleta/liberacao'
import type { QrCardData } from '@/components/brindoleta/QrCardSheet'
import QrPrintAll from './QrPrintAll'

export const metadata = { title: 'Imprimir todos os QR — Brindoleta' }
export const dynamic = 'force-dynamic'

type Owner = {
  barbearia_id: string
  barbearias: { nome: string; logo_url: string | null } | null
}

export default async function BrindoletaQrTodosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, logo_url)')
    .eq('id', user.id)
    .single()
  const owner = ownerRaw as unknown as Owner | null
  if (!owner?.barbearia_id || !owner.barbearias) redirect('/dashboard')

  // Licença avulsa ativa OU assinatura em dia.
  if (!(await brindoletaLiberada(supabase, owner.barbearia_id))) redirect('/dashboard/brindoleta')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbersRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, foto_url, link_codigo')
    .eq('barbearia_id', owner.barbearia_id)
    .eq('ativo', true)
    .order('nome', { ascending: true })
  const barbers = (barbersRaw ?? []) as { id: string; nome: string; foto_url: string | null; link_codigo: string }[]

  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')

  const cards: QrCardData[] = barbers.map((barber) => ({
    businessName: owner.barbearias!.nome,
    businessLogo: owner.barbearias!.logo_url,
    barberName: barber.nome,
    barberPhoto: barber.foto_url,
    publicUrl: `${protocol}://${host}/brindoleta/${barber.link_codigo}`,
  }))

  return <QrPrintAll cards={cards} />
}
