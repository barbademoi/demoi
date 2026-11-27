'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TAREFIX_PRICE_CENTS, limparWhatsapp } from '@/lib/tarefixModulo/config'
import { avisarAdminTarefix } from '@/lib/tarefixModulo/liberacao'

export type SolicitarTarefixResult = { ok?: boolean; status?: 'pending' | 'active'; error?: string }

/** O dono avisa que fez o Pix: abre o pedido para o admin conferir. */
export async function solicitarAcessoTarefix(formData: FormData): Promise<SolicitarTarefixResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.' }

  const nomeBarbearia = String(formData.get('nome_barbearia') ?? '').trim().slice(0, 80)
  const whatsapp = limparWhatsapp(String(formData.get('whatsapp') ?? ''))
  const payerInformado = String(formData.get('payer_name') ?? '').trim().slice(0, 120)
  const paymentNote = String(formData.get('payment_note') ?? '').trim().slice(0, 240)
  if (nomeBarbearia.length < 2) return { error: 'Informe o nome da barbearia.' }
  if (!whatsapp) return { error: 'Informe um WhatsApp válido, com DDD.' }

  // A barbearia sempre vem da sessão; o navegador nunca manda ID de conta.
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
  const tabela = () => (admin as any).from('tarefix_licencas')
  const { data: atual } = await tabela().select('status').eq('barbearia_id', barbeariaId).maybeSingle()
  if (atual?.status === 'active') return { ok: true, status: 'active' }
  if (atual?.status === 'pending') return { ok: true, status: 'pending' }
  if (atual?.status === 'suspended') return { error: 'Este acesso está suspenso. Fale com o suporte.' }

  const agora = new Date().toISOString()
  const pedido = {
    status: 'pending',
    amount_cents: TAREFIX_PRICE_CENTS,
    nome_barbearia: nomeBarbearia,
    whatsapp,
    payer_name: payerInformado.length >= 3 ? payerInformado : nomeBarbearia,
    payment_note: paymentNote || null,
    requested_by: user.id,
    requested_at: agora,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    updated_at: agora,
  }
  const { error } = atual
    ? await tabela().update(pedido).eq('barbearia_id', barbeariaId)
    : await tabela().insert({ barbearia_id: barbeariaId, ...pedido })
  if (error) {
    console.error('[tarefix-modulo] erro ao registrar pedido:', error)
    return { error: 'Não foi possível registrar o pedido. Tente novamente.' }
  }

  await avisarAdminTarefix(`Pedido do Tarefix: ${nomeBarbearia} avisou o Pix de R$ 47`)
  revalidatePath('/dashboard/tarefix')
  revalidatePath('/admin/tarefix')
  return { ok: true, status: 'pending' }
}
