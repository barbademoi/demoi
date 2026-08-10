'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BrindoletaOfferType, BrindoletaSaleStatus } from '@/lib/brindoleta/types'
import { brindoletaLiberada } from '@/lib/brindoleta/liberacao'

const MAX_ACTIVE_OFFERS = 6
const OFFER_TYPES: BrindoletaOfferType[] = ['Serviço', 'Produto', 'Brinde']

type OfferInput = {
  id?: string
  title: string
  benefit: string
  offerType: BrindoletaOfferType
  chance: number
  stock: number
  revenueCents: number
  color: string
  enabled: boolean
}

async function authorizeOwner() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single()

  const barbeariaId = usuario?.barbearia_id as string | undefined
  if (!barbeariaId) return { error: 'Não foi possível identificar sua empresa.' as const }

  const admin = createAdminClient()
  // Licença avulsa ativa OU assinatura em dia — a regra mora no SQL.
  if (!(await brindoletaLiberada(admin, barbeariaId))) {
    return { error: 'A Brindoleta ainda não está liberada para esta empresa.' as const }
  }
  return { admin, barbeariaId }
}

function cleanOffer(input: OfferInput) {
  const title = input.title.trim().slice(0, 50)
  const benefit = input.benefit.trim().slice(0, 140)
  const offerType = OFFER_TYPES.includes(input.offerType) ? input.offerType : 'Serviço'
  const chance = Math.max(1, Math.min(100, Math.round(Number(input.chance) || 1)))
  const stock = Math.max(0, Math.min(99999, Math.round(Number(input.stock) || 0)))
  const revenueCents = Math.max(0, Math.min(100000000, Math.round(Number(input.revenueCents) || 0)))
  const color = /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : '#d8ff00'
  // `pediuAtivar` guarda o que o DONO escolheu; `enabled` é o que vai pro banco.
  // Os dois só divergem quando o estoque é zero — e nesse caso quem chama
  // devolve erro em vez de gravar. Ver saveBrindoletaOffer.
  const pediuAtivar = !!input.enabled
  return { title, benefit, offerType, chance, stock, revenueCents, color, pediuAtivar, enabled: pediuAtivar && stock > 0 }
}

export async function saveBrindoletaOffer(input: OfferInput) {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  const { admin, barbeariaId } = auth
  const offer = cleanOffer(input)

  if (offer.title.length < 2) return { error: 'Informe um nome para a oferta.' }
  if (offer.benefit.length < 2) return { error: 'Explique o benefício que o cliente receberá.' }

  // Estoque zero desativava a oferta EM SILÊNCIO: o dono marcava "ativa",
  // salvava, via "Oferta atualizada" e a roleta continuava com as antigas —
  // porque ela filtra enabled = true AND stock > 0. Salvar algo diferente do
  // que a pessoa pediu sem avisar é o pior desfecho possível aqui; agora fala.
  if (offer.pediuAtivar && offer.stock <= 0) {
    return { error: 'Para deixar a oferta ativa, informe um estoque maior que zero. Com estoque 0 ela não aparece na roleta.' }
  }

  if (offer.enabled) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (admin as any)
      .from('brindoleta_offers')
      .select('id', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId)
      .eq('enabled', true)
    if (input.id) countQuery = countQuery.neq('id', input.id)
    const { count } = await countQuery
    if ((count ?? 0) >= MAX_ACTIVE_OFFERS) {
      return { error: `A roleta aceita no máximo ${MAX_ACTIVE_OFFERS} ofertas ativas.` }
    }
  }

  const payload = {
    barbearia_id: barbeariaId,
    title: offer.title,
    benefit: offer.benefit,
    offer_type: offer.offerType,
    chance: offer.chance,
    stock: offer.stock,
    revenue_cents: offer.revenueCents,
    color: offer.color,
    enabled: offer.enabled,
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (admin as any).from('brindoleta_offers')
  const { error } = input.id
    ? await query.update(payload).eq('id', input.id).eq('barbearia_id', barbeariaId)
    : await query.insert(payload)

  if (error) {
    console.error('[brindoleta/painel] erro ao salvar oferta:', error)
    return { error: 'Não foi possível salvar a oferta.' }
  }
  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}

export async function deleteBrindoletaOffer(id: string) {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (auth.admin as any)
    .from('brindoleta_offers')
    .delete()
    .eq('id', id)
    .eq('barbearia_id', auth.barbeariaId)
  if (error) return { error: 'Não foi possível excluir a oferta.' }
  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}

export async function createBrindoletaExamples() {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  const { admin, barbeariaId } = auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('brindoleta_offers')
    .select('id', { count: 'exact', head: true })
    .eq('barbearia_id', barbeariaId)
  if ((count ?? 0) > 0) return { error: 'Sua campanha já possui ofertas cadastradas.' }

  const examples = [
    ['20% OFF LIMPEZA DE PELE', 'R$ 10,00 de desconto', 'Serviço', 20, 30, 4000, '#9365ed'],
    ['30% OFF POMADA', 'Em uma pomada selecionada', 'Produto', 18, 20, 3500, '#f44696'],
    ['20% OFF SHAMPOO', 'Em um shampoo selecionado', 'Produto', 16, 20, 3000, '#d8ff00'],
    ['20% OFF LEAV-IN', 'Em um leave-in selecionado', 'Produto', 16, 20, 2800, '#ff6045'],
    ['25% OFF HIDRATAÇÃO', 'Hidratação no atendimento de hoje', 'Serviço', 15, 30, 2500, '#ffd149'],
    ['PEZINHO GRÁTIS', 'No próximo corte', 'Brinde', 15, 15, 0, '#35b7eb'],
  ] as const

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('brindoleta_offers').insert(
    examples.map(([title, benefit, offer_type, chance, stock, revenue_cents, color]) => ({
      barbearia_id: barbeariaId,
      title,
      benefit,
      offer_type,
      chance,
      stock,
      revenue_cents,
      color,
      enabled: true,
    })),
  )
  if (error) return { error: 'Não foi possível criar as ofertas de exemplo.' }
  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}

export async function decideBrindoletaSale(id: string, status: Extract<BrindoletaSaleStatus, 'confirmed' | 'rejected'>) {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  if (!['confirmed', 'rejected'].includes(status)) return { error: 'Ação inválida.' }
  const { admin, barbeariaId } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: changed, error } = await (admin as any)
    .rpc('decide_brindoleta_sale', {
      p_sale_id: id,
      p_barbearia_id: barbeariaId,
      p_status: status,
    })
  if (error) return { error: 'Não foi possível atualizar a venda.' }
  if (!changed) return { error: 'Esta venda não foi encontrada ou já foi analisada.' }

  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}

export async function updateBrindoletaSale(input: { id: string; customerName: string; amountCents: number }) {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  const customerName = input.customerName.trim().slice(0, 80)
  const amountCents = Math.max(0, Math.min(100000000, Math.round(Number(input.amountCents) || 0)))
  if (customerName.length < 2) return { error: 'Informe o nome do cliente.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (auth.admin as any)
    .from('brindoleta_sales')
    .update({ customer_name: customerName, amount_cents: amountCents })
    .eq('id', input.id)
    .eq('barbearia_id', auth.barbeariaId)
  if (error) return { error: 'Não foi possível editar a venda.' }
  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}

export async function deleteBrindoletaSale(id: string) {
  const auth = await authorizeOwner()
  if ('error' in auth) return { error: auth.error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deleted, error } = await (auth.admin as any)
    .rpc('delete_brindoleta_sale', {
      p_sale_id: id,
      p_barbearia_id: auth.barbeariaId,
    })
  if (error) return { error: 'Não foi possível excluir a venda.' }
  if (!deleted) return { error: 'Venda não encontrada.' }
  revalidatePath('/dashboard/brindoleta')
  return { ok: true as const }
}
