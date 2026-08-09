'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BRINDOLETA_PRICE_CENTS } from '@/lib/brindoleta/config'
import { brindoletaLiberada } from '@/lib/brindoleta/liberacao'

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

  const payerNameInformado = String(formData.get('payer_name') ?? '').trim().slice(0, 120)
  const paymentNote = String(formData.get('payment_note') ?? '').trim().slice(0, 240)

  // Sempre deriva a barbearia da sessão. O cliente nunca envia um ID de conta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome)')
    .eq('id', user.id)
    .single()

  const barbeariaId = usuario?.barbearia_id as string | undefined
  if (!barbeariaId) return { error: 'Não foi possível identificar sua empresa.' }

  // O aviso nunca trava por falta de digitação: quando o dono não informa o
  // nome do Pix, identificamos o pedido pela própria conta (empresa + e-mail),
  // que é o que o responsável usa pra conferir o pagamento.
  const empresaNome = String(usuario?.barbearias?.nome ?? '').trim()
  const payerName = payerNameInformado.length >= 3
    ? payerNameInformado
    : (empresaNome || user.email || 'Conta sem nome').slice(0, 120)

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: atual } = await (admin as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', barbeariaId)
    .maybeSingle()

  // Assinante já tem a Brindoleta pela assinatura: não abre pedido de Pix nem
  // cria licença: seria cobrar de novo por algo que já está incluso.
  if (atual?.status === 'active' || await brindoletaLiberada(admin, barbeariaId)) {
    return { ok: true, status: 'active' }
  }
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
