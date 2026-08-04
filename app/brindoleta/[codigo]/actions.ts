'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { BrindoletaPrize, PublicBrindoletaOffer } from '@/lib/brindoleta/types'

type SpinInput = {
  codigo: string
  clientToken: string
}

type AcceptInput = SpinInput & {
  spinId: string
  customerName: string
}

type PublicBarber = {
  id: string
  barbearia_id: string
}

type OfferRow = PublicBrindoletaOffer & {
  benefit: string
  revenue_cents: number
  chance: number
}

function cleanCode(value: string) {
  return value.trim().toLowerCase().slice(0, 40)
}

function cleanToken(value: string) {
  const token = value.trim().slice(0, 100)
  return /^[a-zA-Z0-9_-]{16,100}$/.test(token) ? token : null
}

function todayInBrazil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function authorizePublicLink(codigo: string): Promise<
  { barber: PublicBarber; admin: ReturnType<typeof createAdminClient> } | { error: string }
> {
  const code = cleanCode(codigo)
  if (!code) return { error: 'Este QR Code não é válido.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barber } = await (admin as any)
    .from('barbeiros')
    .select('id, barbearia_id')
    .eq('link_codigo', code)
    .eq('ativo', true)
    .maybeSingle() as { data: PublicBarber | null }

  if (!barber) return { error: 'Este QR Code não está disponível.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: license } = await (admin as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', barber.barbearia_id)
    .maybeSingle() as { data: { status: string } | null }

  if (license?.status !== 'active') return { error: 'Esta Brindoleta não está disponível no momento.' }
  return { barber, admin }
}

function weightedDraw(offers: OfferRow[]) {
  const total = offers.reduce((sum, offer) => sum + Math.max(1, offer.chance), 0)
  let cursor = Math.random() * total
  for (const offer of offers) {
    cursor -= Math.max(1, offer.chance)
    if (cursor <= 0) return offer
  }
  return offers[offers.length - 1]
}

export async function spinBrindoleta(input: SpinInput): Promise<
  | { ok: true; spinId: string; prize: BrindoletaPrize; offers: PublicBrindoletaOffer[] }
  | { error: string; code?: 'already_spun' }
> {
  const clientToken = cleanToken(input.clientToken)
  if (!clientToken) return { error: 'Não foi possível identificar este aparelho. Atualize a página e tente novamente.' }

  const auth = await authorizePublicLink(input.codigo)
  if ('error' in auth) return auth
  const { admin, barber } = auth
  const dayKey = todayInBrazil()

  // Consulta amigável; a restrição UNIQUE no banco também impede dois giros simultâneos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previous } = await (admin as any)
    .from('brindoleta_spins')
    .select('id')
    .eq('barbearia_id', barber.barbearia_id)
    .eq('client_token', clientToken)
    .eq('day_key', dayKey)
    .maybeSingle()
  if (previous) return { error: 'Seu giro de hoje já foi utilizado. Volte amanhã para uma nova chance!', code: 'already_spun' }

  // A probabilidade fica somente no servidor; o navegador recebe apenas a oferta sorteada.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: offersRaw } = await (admin as any)
    .from('brindoleta_offers')
    .select('id, title, benefit, offer_type, color, revenue_cents, chance')
    .eq('barbearia_id', barber.barbearia_id)
    .eq('enabled', true)
    .gt('stock', 0)
    .order('created_at', { ascending: true })
    .limit(6)
  const offers = (offersRaw ?? []) as OfferRow[]
  if (offers.length < 2) return { error: 'A empresa ainda está preparando as ofertas desta roleta.' }

  const selected = weightedDraw(offers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: spin, error } = await (admin as any)
    .from('brindoleta_spins')
    .insert({
      barbearia_id: barber.barbearia_id,
      barbeiro_id: barber.id,
      offer_id: selected.id,
      client_token: clientToken,
      day_key: dayKey,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: { code?: string } | null }

  if (error || !spin) {
    if (error?.code === '23505') return { error: 'Seu giro de hoje já foi utilizado. Volte amanhã para uma nova chance!', code: 'already_spun' }
    console.error('[brindoleta/publica] erro ao registrar giro:', error)
    return { error: 'Não foi possível realizar o giro agora. Tente novamente em instantes.' }
  }

  return {
    ok: true,
    spinId: spin.id,
    offers: offers.map(({ id, title, offer_type, color }) => ({ id, title, offer_type, color })),
    prize: {
      id: selected.id,
      title: selected.title,
      benefit: selected.benefit,
      offer_type: selected.offer_type,
      color: selected.color,
      revenue_cents: selected.revenue_cents,
    },
  }
}

export async function acceptBrindoletaPrize(input: AcceptInput): Promise<
  { ok: true } | { error: string }
> {
  const clientToken = cleanToken(input.clientToken)
  const customerName = input.customerName.trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!clientToken) return { error: 'Não foi possível validar este aparelho.' }
  if (customerName.length < 2) return { error: 'Digite seu nome para reservar a oferta.' }

  const auth = await authorizePublicLink(input.codigo)
  if ('error' in auth) return auth
  const { admin, barber } = auth

  // O giro, o token, o dia e o profissional precisam coincidir.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: spin } = await (admin as any)
    .from('brindoleta_spins')
    .select('id, offer_id, day_key')
    .eq('id', input.spinId)
    .eq('barbearia_id', barber.barbearia_id)
    .eq('barbeiro_id', barber.id)
    .eq('client_token', clientToken)
    .maybeSingle() as { data: { id: string; offer_id: string | null; day_key: string } | null }

  if (!spin || spin.day_key !== todayInBrazil() || !spin.offer_id) {
    return { error: 'Esta oferta não pôde ser validada.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('brindoleta_sales')
    .select('id')
    .eq('spin_id', spin.id)
    .maybeSingle()
  if (existing) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: offer } = await (admin as any)
    .from('brindoleta_offers')
    .select('id, title, benefit, revenue_cents')
    .eq('id', spin.offer_id)
    .eq('barbearia_id', barber.barbearia_id)
    .maybeSingle() as { data: { id: string; title: string; benefit: string; revenue_cents: number } | null }
  if (!offer) return { error: 'Esta oferta não está mais disponível.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('brindoleta_sales')
    .insert({
      spin_id: spin.id,
      barbearia_id: barber.barbearia_id,
      barbeiro_id: barber.id,
      offer_id: offer.id,
      customer_name: customerName,
      offer_title: offer.title,
      benefit: offer.benefit,
      amount_cents: offer.revenue_cents,
      status: 'pending',
    })
  if (error) {
    if (error.code === '23505') return { ok: true }
    console.error('[brindoleta/publica] erro ao aceitar oferta:', error)
    return { error: 'Não foi possível reservar a oferta. Tente novamente.' }
  }

  return { ok: true }
}
