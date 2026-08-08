'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { avaliarAcesso, type EstadoAcesso } from '@/lib/assinatura/acesso'

export type LinhaAssinante = {
  id: string
  email: string
  barbearia: string
  status: string | null
  periodicidade: string | null
  validoAte: string | null
  assinaturaId: string | null
  estado: EstadoAcesso
  liberado: boolean
  diasParaVencer: number | null
}

export type AcaoAssinatura = 'estender' | 'liberar' | 'bloquear' | 'vitalicio'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return null
  return user
}

/**
 * Lista SÓ os assinantes (tipo_acesso='mensal').
 *
 * Vitalício fica de fora: ele não tem status nem validade pra tratar, e
 * misturá-lo aqui encheria a tela com ~600 linhas sem nenhuma exceção — o
 * painel existe justamente pra achar rápido quem precisa de ação.
 */
export async function listarAssinantes(): Promise<{ rows: LinhaAssinante[]; error?: string }> {
  if (!(await assertAdmin())) return { rows: [], error: 'Sem permissão.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .from('usuarios')
    .select('id, email, tipo_acesso, status_assinatura, periodicidade, valido_ate, assinatura_id, barbearias(nome)')
    .eq('tipo_acesso', 'mensal')
    .order('valido_ate', { ascending: true, nullsFirst: true })

  if (error) {
    console.error('[admin/assinaturas] erro ao listar:', error)
    return { rows: [], error: 'Não foi possível carregar os assinantes.' }
  }

  const agora = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).map((u) => {
    const a = avaliarAcesso(u, agora)
    return {
      id: u.id,
      email: u.email,
      barbearia: u.barbearias?.nome ?? '—',
      status: u.status_assinatura,
      periodicidade: u.periodicidade,
      validoAte: u.valido_ate,
      assinaturaId: u.assinatura_id,
      estado: a.estado,
      liberado: a.liberado,
      diasParaVencer: a.diasParaVencer,
    }
  })
  return { rows }
}

/**
 * Ações de exceção sobre UMA conta.
 *
 * Tudo aqui é manual e deliberado, então `origem` registra que veio do admin —
 * senão, meses depois, ninguém distingue o que o webhook decidiu sozinho do
 * que foi ajustado na mão.
 */
export async function ajustarAssinatura(
  usuarioId: string,
  acao: AcaoAssinatura,
  dias = 30,
): Promise<{ ok?: true; error?: string }> {
  const admin = await assertAdmin()
  if (!admin) return { error: 'Sem permissão.' }
  if (!/^[0-9a-f-]{36}$/i.test(usuarioId)) return { error: 'Conta inválida.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createAdminClient()
  const { data: atual } = await db
    .from('usuarios').select('id, tipo_acesso, valido_ate').eq('id', usuarioId).maybeSingle()
  if (!atual) return { error: 'Conta não encontrada.' }

  const agora = new Date()
  const patch: Record<string, unknown> = {}

  switch (acao) {
    case 'vitalicio':
      // Vira permanente e larga a régua de validade de vez.
      patch.tipo_acesso = 'vitalicio'
      patch.status_assinatura = null
      patch.valido_ate = null
      patch.periodicidade = null
      patch.origem = 'admin:vitalicio'
      break
    case 'estender': {
      // Estende do que já existe se estiver no futuro; senão, de hoje — mesma
      // regra da renovação automática, pra não presentear nem punir.
      const base = atual.valido_ate && new Date(atual.valido_ate) > agora
        ? new Date(atual.valido_ate) : agora
      const nova = new Date(base.getTime())
      nova.setDate(nova.getDate() + Math.max(1, Math.min(365, Math.round(dias))))
      patch.valido_ate = nova.toISOString()
      patch.status_assinatura = 'ativa'
      break
    }
    case 'liberar':
      // Destrava sem inventar prazo longo: serve pro caso do pagamento que
      // entrou mas cujo evento não chegou. 7 dias até o webhook se acertar.
      patch.status_assinatura = 'ativa'
      if (!atual.valido_ate || new Date(atual.valido_ate) <= agora) {
        const nova = new Date(agora.getTime())
        nova.setDate(nova.getDate() + 7)
        patch.valido_ate = nova.toISOString()
      }
      break
    case 'bloquear':
      patch.status_assinatura = 'cancelada'
      patch.valido_ate = agora.toISOString()
      break
  }

  const { error } = await db.from('usuarios').update(patch).eq('id', usuarioId)
  if (error) {
    console.error('[admin/assinaturas] erro ao ajustar:', error)
    return { error: 'Não foi possível aplicar a alteração.' }
  }
  console.log('[admin/assinaturas] ajuste manual:', { usuarioId, acao, por: admin.email, patch })
  revalidatePath('/admin/assinaturas')
  return { ok: true }
}
