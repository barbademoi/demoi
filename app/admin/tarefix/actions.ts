'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import type { TarefixLicencaStatus } from '@/lib/tarefixModulo/config'
import { garantirTarefixDoDono, suspenderTarefixDoDono } from '@/lib/tarefixModulo/liberacao'

export type TarefixPedido = {
  barbeariaId: string
  barbeariaNome: string
  nomeInformado: string
  whatsapp: string
  ownerEmail: string
  status: TarefixLicencaStatus
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

type Linha = {
  barbearia_id: string
  status: TarefixLicencaStatus
  amount_cents: number
  nome_barbearia: string | null
  whatsapp: string | null
  payer_name: string | null
  payment_note: string | null
  requested_by: string | null
  requested_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
}

export async function listarPedidosTarefix(): Promise<{ pedidos: TarefixPedido[]; error?: string }> {
  if (!(await assertAdmin())) return { pedidos: [], error: 'Sem permissão.' }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('tarefix_licencas')
    .select('barbearia_id, status, amount_cents, nome_barbearia, whatsapp, payer_name, payment_note, requested_by, requested_at, reviewed_at, rejection_reason')
    .order('requested_at', { ascending: false, nullsFirst: false })
  if (error) {
    console.error('[admin/tarefix] erro ao listar:', error)
    return { pedidos: [], error: 'Não foi possível carregar os pedidos.' }
  }
  const linhas = (data ?? []) as Linha[]
  const ids = linhas.map((l) => l.barbearia_id)
  let barbearias: { id: string; nome: string }[] = []
  let usuarios: { id: string; barbearia_id: string; email: string }[] = []
  if (ids.length) {
    const [b, u] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from('barbearias').select('id, nome').in('id', ids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from('usuarios').select('id, barbearia_id, email').in('barbearia_id', ids),
    ])
    barbearias = b.data ?? []
    usuarios = u.data ?? []
  }
  return {
    pedidos: linhas.map((l) => ({
      barbeariaId: l.barbearia_id,
      barbeariaNome: barbearias.find((x) => x.id === l.barbearia_id)?.nome ?? 'Empresa não encontrada',
      nomeInformado: l.nome_barbearia ?? '',
      whatsapp: l.whatsapp ?? '',
      ownerEmail: (usuarios.find((x) => x.id === l.requested_by) ?? usuarios.find((x) => x.barbearia_id === l.barbearia_id))?.email ?? '—',
      status: l.status,
      amountCents: l.amount_cents,
      payerName: l.payer_name ?? '—',
      paymentNote: l.payment_note ?? '',
      requestedAt: l.requested_at,
      reviewedAt: l.reviewed_at,
      rejectionReason: l.rejection_reason ?? '',
    })),
  }
}

/** Confirmar Pix (libera e cria o Tarefix do dono), recusar ou suspender. */
export async function revisarPedidoTarefix(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const revisor = await assertAdmin()
  if (!revisor) return { error: 'Sem permissão.' }
  const barbeariaId = String(formData.get('barbearia_id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim() as TarefixLicencaStatus
  const motivo = String(formData.get('reason') ?? '').trim().slice(0, 240)
  if (!/^[0-9a-f-]{36}$/i.test(barbeariaId)) return { error: 'Empresa inválida.' }
  if (!['active', 'rejected', 'suspended'].includes(status)) return { error: 'Ação inválida.' }
  if (status === 'rejected' && motivo.length < 3) return { error: 'Informe o motivo da recusa.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabela = () => (admin as any).from('tarefix_licencas')
  const { data: lic } = await tabela().select('requested_by, nome_barbearia').eq('barbearia_id', barbeariaId).maybeSingle()
  if (!lic) return { error: 'Pedido não encontrado.' }

  // dono da conta: quem pediu (ou o usuário da barbearia, se sumiu)
  let userId = lic.requested_by as string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (admin as any)
    .from('usuarios')
    .select('id, email')
    .eq(userId ? 'id' : 'barbearia_id', userId ?? barbeariaId)
    .limit(1)
    .maybeSingle()
  userId = (usuario?.id as string | undefined) ?? userId

  if (status === 'active') {
    if (!userId || !usuario?.email) return { error: 'Não achei a conta do dono desta barbearia.' }
    const { data: conta } = await admin.auth.admin.getUserById(userId)
    const meta = (conta?.user?.user_metadata ?? {}) as Record<string, unknown>
    const nomeDono = [meta.nome, meta.full_name, meta.name].find((v): v is string => typeof v === 'string' && v.trim().length > 0) ?? null
    const r = await garantirTarefixDoDono({ userId, email: usuario.email, nomeBarbearia: lic.nome_barbearia ?? '', nomeDono })
    if (!r.ok) return { error: r.erro }
  }
  if (status === 'suspended' && userId) await suspenderTarefixDoDono(userId)

  const agora = new Date().toISOString()
  const { error } = await tabela()
    .update({ status, reviewed_by: revisor.id, reviewed_at: agora, rejection_reason: status === 'rejected' ? motivo : null, updated_at: agora })
    .eq('barbearia_id', barbeariaId)
  if (error) {
    console.error('[admin/tarefix] erro ao revisar:', error)
    return { error: 'Não foi possível atualizar este pedido.' }
  }
  revalidatePath('/admin/tarefix')
  revalidatePath('/dashboard/tarefix')
  return { ok: true }
}
