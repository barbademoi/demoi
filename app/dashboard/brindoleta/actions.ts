'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BRINDOLETA_PRICE_CENTS } from '@/lib/brindoleta/config'
import { emailPodeBrindoleta } from '@/lib/brindoleta/acesso'

export type SolicitarBrindoletaResult = {
  ok?: boolean
  status?: 'pending' | 'active'
  error?: string
}
export async function solicitarAcessoBrindoleta(
  formData: FormData,
): Promise<SolicitarBrindoletaResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.' }
  // Em teste: só a conta liberada acessa a Brindoleta.
  if (!emailPodeBrindoleta(user.email)) return { error: 'A Brindoleta ainda não está liberada para esta conta.' }

  const payerName = String(formData.get('payer_name') ?? '').trim().slice(0, 120)
  const paymentNote = String(formData.get('payment_note') ?? '').trim().slice(0, 240)
  if (payerName.length < 3) {
    return { error: 'Informe o nome de quem fez o Pix.' }
  }

  // Sempre deriva a barbearia da sessão. O cliente nunca envia um ID de conta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single()

  const barbeariaId = usuario?.barbearia_id as string | undefined
  if (!barbeariaId) return { error: 'Não foi possível identificar sua empresa.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: atual } = await (admin as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', barbeariaId)
    .maybeSingle()

  if (atual?.status === 'active') return { ok: true, status: 'active' }
  if (atual?.status === 'pending') return { ok: true, status: 'pending' }

  const pedido = {
    status: 'pending',
    amount_cents: BRINDOLETA_PRICE_CENTS,
    payer_name: payerName,
    payment_note: paymentNote || null,
    requested_by: user.id,
    requested_at: new Date().toISOString(),
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (admin as any).from('brindoleta_licenses')
  const { error } = atual
    ? await query.update(pedido).eq('barbearia_id', barbeariaId)
    : await query.insert({ barbearia_id: barbeariaId, ...pedido })

  if (error) {
    console.error('[brindoleta] erro ao registrar pedido:', error)
    return { error: 'Não foi possível registrar o pedido. Tente novamente.' }
  }

  revalidatePath('/dashboard/brindoleta')
  revalidatePath('/admin/brindoleta')
  return { ok: true, status: 'pending' }
}
