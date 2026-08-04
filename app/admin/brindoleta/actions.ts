'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import type { BrindoletaStatus } from '@/lib/brindoleta/config'

type AdminClient = ReturnType<typeof createAdminClient>

export type BrindoletaOrder = {
  barbeariaId: string
  barbeariaNome: string
  ownerEmail: string
  status: BrindoletaStatus
  amountCents: number
  payerName: string
  paymentNote: string
  requestedAt: string | null
  reviewedAt: string | null
  rejectionReason: string
}
async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return null
  return user
}

export async function listarPedidosBrindoleta(): Promise<{
  orders: BrindoletaOrder[]
  error?: string
}> {
  if (!(await assertAdmin())) return { orders: [], error: 'Sem permissão.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: licenses, error } = await (admin as any)
    .from('brindoleta_licenses')
    .select('barbearia_id, status, amount_cents, payer_name, payment_note, requested_at, reviewed_at, rejection_reason')
    .order('requested_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[admin/brindoleta] erro ao listar:', error)
    return { orders: [], error: 'Não foi possível carregar os pedidos.' }
  }

  const rows = (licenses ?? []) as Array<{
    barbearia_id: string
    status: BrindoletaStatus
    amount_cents: number
    payer_name: string | null
    payment_note: string | null
    requested_at: string | null
    reviewed_at: string | null
    rejection_reason: string | null
  }>
  const ids = rows.map((row) => row.barbearia_id)

  let barbearias: Array<{ id: string; nome: string }> = []
  let usuarios: Array<{ barbearia_id: string; email: string }> = []
  if (ids.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [barbResult, userResult] = await Promise.all([
      (admin as any).from('barbearias').select('id, nome').in('id', ids),
      (admin as any).from('usuarios').select('barbearia_id, email').in('barbearia_id', ids),
    ])
    barbearias = (barbResult.data ?? []) as typeof barbearias
    usuarios = (userResult.data ?? []) as typeof usuarios
  }

  return {
    orders: rows.map((row) => ({
      barbeariaId: row.barbearia_id,
      barbeariaNome: barbearias.find((item) => item.id === row.barbearia_id)?.nome ?? 'Empresa não encontrada',
      ownerEmail: usuarios.find((item) => item.barbearia_id === row.barbearia_id)?.email ?? '—',
      status: row.status,
      amountCents: row.amount_cents,
      payerName: row.payer_name ?? '—',
      paymentNote: row.payment_note ?? '',
      requestedAt: row.requested_at,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason ?? '',
    })),
  }
}

export async function revisarPedidoBrindoleta(formData: FormData): Promise<{
  ok?: boolean
  error?: string
}> {
  const reviewer = await assertAdmin()
  if (!reviewer) return { error: 'Sem permissão.' }

  const barbeariaId = String(formData.get('barbearia_id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim() as BrindoletaStatus
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 240)
  if (!/^[0-9a-f-]{36}$/i.test(barbeariaId)) return { error: 'Empresa inválida.' }
  if (!['active', 'rejected', 'suspended'].includes(status)) return { error: 'Ação inválida.' }
  if (status === 'rejected' && reason.length < 3) return { error: 'Informe o motivo da recusa.' }

  const now = new Date().toISOString()
  const admin: AdminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('brindoleta_licenses')
    .update({
      status,
      reviewed_by: reviewer.id,
      reviewed_at: now,
      rejection_reason: status === 'rejected' ? reason : null,
      updated_at: now,
    })
    .eq('barbearia_id', barbeariaId)
    .select('barbearia_id')
    .maybeSingle()

  if (error || !data) {
    console.error('[admin/brindoleta] erro ao revisar:', error)
    return { error: 'Não foi possível atualizar este pedido.' }
  }

  revalidatePath('/admin/brindoleta')
  revalidatePath('/dashboard/brindoleta')
  return { ok: true }
}
