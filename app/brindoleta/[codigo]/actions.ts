'use server'

import { createHmac, randomUUID } from 'crypto'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { brindoletaLiberada } from '@/lib/brindoleta/liberacao'
import { buscarOfertasAtivas } from '@/lib/brindoleta/ofertasAtivas'
import type { BrindoletaPrize, PublicBrindoletaOffer } from '@/lib/brindoleta/types'

type SpinInput = {
  codigo: string
}

type AcceptInput = {
  codigo: string
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

type SpinSnapshot = {
  id: string
  offer_id: string | null
  offer_title: string
  benefit: string
  offer_type: BrindoletaPrize['offer_type']
  offer_color: string
  amount_cents: number
}

const DEVICE_COOKIE = 'brindoleta_device_v1'

function cleanCode(value: string) {
  const code = value.trim().toLowerCase().slice(0, 40)
  return /^[a-z0-9]{4,40}$/.test(code) ? code : ''
}

function cleanToken(value: string) {
  const token = value.trim().slice(0, 100)
  return /^[a-zA-Z0-9_-]{16,100}$/.test(token) ? token : null
}

function deviceToken(createIfMissing: boolean) {
  const cookieStore = cookies()
  const current = cleanToken(cookieStore.get(DEVICE_COOKIE)?.value ?? '')
  if (current) return current
  if (!createIfMissing) return null

  const token = `${randomUUID().replace(/-/g, '')}_${randomUUID().replace(/-/g, '')}`
  cookieStore.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 730,
  })
  return token
}

function todayInBrazil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function networkFingerprint() {
  const requestHeaders = headers()
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || requestHeaders.get('x-real-ip')?.trim() || 'unknown-network'
  const secret = process.env.BRINDOLETA_FINGERPRINT_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || 'brindoleta-local-development'
  return createHmac('sha256', secret).update(address).digest('hex')
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

  if (!(await brindoletaLiberada(admin, barber.barbearia_id))) {
    return { error: 'Esta Brindoleta não está disponível no momento.' }
  }
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

async function activeOffers(admin: ReturnType<typeof createAdminClient>, barbeariaId: string) {
  // Mesma fonte da página aberta pelo QR — a roda e o sorteio precisam
  // enxergar exatamente as mesmas ofertas.
  return (await buscarOfertasAtivas(admin, barbeariaId)) as unknown as OfferRow[]
}

/**
 * Lê UMA oferta pelo id, sem filtrar por enabled/stock: depois do giro ela pode
 * ter sido desativada ou zerada, e mesmo assim o texto atual dela é mais
 * correto que o congelado no giro.
 */
async function buscarOfertaPorId(
  admin: ReturnType<typeof createAdminClient>,
  barbeariaId: string,
  offerId: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('brindoleta_offers')
    .select('id, title, benefit, offer_type, color')
    .eq('id', offerId)
    .eq('barbearia_id', barbeariaId)
    .maybeSingle()
  return (data ?? null) as
    | { id: string; title: string; benefit: string; offer_type: string; color: string }
    | null
}

function publicOffers(offers: OfferRow[]) {
  return offers.map(({ id, title, offer_type, color }) => ({ id, title, offer_type, color }))
}

export async function spinBrindoleta(input: SpinInput): Promise<
  | { ok: true; spinId: string; prize: BrindoletaPrize; offers: PublicBrindoletaOffer[]; resumed?: boolean }
  | { error: string; code?: 'already_spun' }
> {
  const clientToken = deviceToken(true)

  const auth = await authorizePublicLink(input.codigo)
  if ('error' in auth) return auth
  const { admin, barber } = auth
  const dayKey = todayInBrazil()

  // Consulta amigável; a restrição UNIQUE no banco também impede dois giros simultâneos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previousRaw } = await (admin as any)
    .from('brindoleta_spins')
    .select('id, offer_id, offer_title, benefit, offer_type, offer_color, amount_cents')
    .eq('barbearia_id', barber.barbearia_id)
    .eq('client_token', clientToken)
    .eq('day_key', dayKey)
    .maybeSingle()
  const previous = previousRaw as SpinSnapshot | null

  if (previous) {
    // Se a página foi recarregada no meio do giro, devolve exatamente o mesmo
    // prêmio. Depois do aceite, apenas informa que o giro já foi concluído.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: accepted } = await (admin as any)
      .from('brindoleta_sales')
      .select('id')
      .eq('spin_id', previous.id)
      .maybeSingle()
    if (accepted) return { error: 'Sua oferta de hoje já foi reservada e está aguardando confirmação.', code: 'already_spun' }

    const currentOffers = await activeOffers(admin, barber.barbearia_id)

    // O giro guarda um SNAPSHOT da oferta (título, benefício, cor) pra
    // sobreviver à exclusão dela. Só que o snapshot também congelava o texto:
    // se o dono editasse a oferta depois do giro, o cliente reabria e via o
    // NOME ANTIGO — a oferta certa, com o texto de ontem. Enquanto a oferta
    // existir, quem manda é o dado ATUAL; o snapshot fica como último recurso,
    // pro caso de ela ter sido apagada.
    const atual = previous.offer_id
      ? await buscarOfertaPorId(admin, barber.barbearia_id, previous.offer_id)
      : null

    const premio = {
      id: previous.offer_id ?? `restored-${previous.id}`,
      title: atual?.title ?? previous.offer_title,
      benefit: atual?.benefit ?? previous.benefit,
      offer_type: (atual?.offer_type ?? previous.offer_type) as BrindoletaPrize['offer_type'],
      color: atual?.color ?? previous.offer_color,
      // O VALOR não segue a oferta: é o que foi combinado no giro. Reprecificar
      // depois mudaria o que o cliente já viu.
      revenue_cents: previous.amount_cents,
    }

    const restored = publicOffers(currentOffers)
    if (!restored.some((offer) => offer.id === previous.offer_id)) {
      if (restored.length >= 6) restored.pop()
      restored.unshift({
        id: premio.id,
        title: premio.title,
        offer_type: premio.offer_type,
        color: premio.color,
      })
    }
    return {
      ok: true,
      resumed: true,
      spinId: previous.id,
      offers: restored,
      prize: premio,
    }
  }

  // A probabilidade fica somente no servidor; o navegador recebe apenas a oferta sorteada.
  const offers = await activeOffers(admin, barber.barbearia_id)
  if (offers.length < 2) return { error: 'A empresa ainda está preparando as ofertas desta roleta.' }

  const selected = weightedDraw(offers)
  // A função no banco serializa tentativas da mesma rede e impede automação
  // por limpeza repetida de cookies, sem armazenar o endereço IP bruto.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: createdRaw, error } = await (admin as any)
    .rpc('create_brindoleta_spin', {
      p_barbearia_id: barber.barbearia_id,
      p_barbeiro_id: barber.id,
      p_offer_id: selected.id,
      p_offer_title: selected.title,
      p_benefit: selected.benefit,
      p_offer_type: selected.offer_type,
      p_offer_color: selected.color,
      p_amount_cents: selected.revenue_cents,
      p_client_token: clientToken,
      p_network_fingerprint: networkFingerprint(),
      p_day_key: dayKey,
    })
  const created = (Array.isArray(createdRaw) ? createdRaw[0] : createdRaw) as {
    status?: string
    spin_id?: string | null
  } | null

  if (error || !created) {
    console.error('[brindoleta/publica] erro ao registrar giro:', error)
    return { error: 'Não foi possível realizar o giro agora. Tente novamente em instantes.' }
  }

  if (created.status === 'already_spun') {
    return { error: 'Seu giro de hoje já foi utilizado. Volte amanhã para uma nova chance!', code: 'already_spun' }
  }
  if (created.status === 'network_limited') {
    return { error: 'O limite de segurança desta rede foi atingido hoje. Tente novamente usando sua internet móvel.' }
  }
  if (created.status !== 'ok' || !created.spin_id) {
    return { error: 'Não foi possível validar este giro. Tente novamente.' }
  }

  return {
    ok: true,
    spinId: created.spin_id,
    offers: publicOffers(offers),
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
  const clientToken = deviceToken(false)
  const customerName = input.customerName
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)
  if (!clientToken) return { error: 'Não foi possível validar este aparelho.' }
  if (customerName.length < 2) return { error: 'Digite seu nome para reservar a oferta.' }

  const auth = await authorizePublicLink(input.codigo)
  if ('error' in auth) return auth
  const { admin, barber } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (admin as any)
    .rpc('accept_brindoleta_prize', {
      p_spin_id: input.spinId,
      p_barbearia_id: barber.barbearia_id,
      p_barbeiro_id: barber.id,
      p_client_token: clientToken,
      p_customer_name: customerName,
      p_day_key: todayInBrazil(),
    })
  if (error) {
    console.error('[brindoleta/publica] erro ao aceitar oferta:', error)
    return { error: 'Não foi possível reservar a oferta. Tente novamente.' }
  }

  if (result === 'ok' || result === 'existing') return { ok: true }
  if (result === 'unavailable') return { error: 'Esta oferta acabou de se esgotar. Fale com o profissional para conhecer outra condição.' }
  return { error: 'Esta oferta não pôde ser validada.' }
}
