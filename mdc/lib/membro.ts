import 'server-only'
import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { diasEntre, hojeSP } from '@/lib/format'

export type Membro = {
  id: string
  created_at: string
  nome: string
  email: string
  whatsapp: string
  plano: string
  status: 'pendente' | 'aguardando' | 'ativo' | 'cancelado'
  data_inicio: string | null
  vencimento: string | null
  perfil: 'sozinho' | 'equipe' | null
  cidade: string | null
  uf: string | null
  fundador: boolean
  convidado: boolean
  observacao: string | null
}

export type StatusExibido = 'pendente' | 'aguardando' | 'ativo' | 'vence_em_breve' | 'vencido' | 'cancelado'

export const STATUS_EXIBIDO: Record<StatusExibido, { rotulo: string; cor: string }> = {
  pendente: { rotulo: 'Aguardando pagamento', cor: 'border-linha text-suave' },
  aguardando: { rotulo: 'Aguardando confirmação', cor: 'border-latao/60 text-latao' },
  ativo: { rotulo: 'Ativo', cor: 'border-ok/60 text-ok' },
  vence_em_breve: { rotulo: 'Vence em breve', cor: 'border-alerta/60 text-alerta' },
  vencido: { rotulo: 'Vencido', cor: 'border-perigo/60 text-perigo' },
  cancelado: { rotulo: 'Cancelado', cor: 'border-linha text-suave line-through' },
}

/** Status que aparece na tela, calculado pelo vencimento. */
export function statusExibido(m: Pick<Membro, 'status' | 'vencimento'>, hoje = hojeSP()): StatusExibido {
  if (m.status === 'cancelado') return 'cancelado'
  if (m.status !== 'ativo' || !m.vencimento) return m.status === 'ativo' ? 'aguardando' : m.status
  const faltam = diasEntre(hoje, m.vencimento)
  if (faltam < 0) return 'vencido'
  if (faltam <= 5) return 'vence_em_breve'
  return 'ativo'
}

/** Semana do membro: semanas completas desde o início + 1 (0 = ainda não começou). */
export function semanaDoMembro(dataInicio: string | null | undefined, hoje = hojeSP()): number {
  if (!dataInicio) return 0
  const d = diasEntre(dataInicio, hoje)
  if (d < 0) return 0
  return Math.floor(d / 7) + 1
}

export async function buscarMembro() {
  const { supabase, user } = await usuarioAtual()
  if (!user) return { supabase, user: null, membro: null }
  const { data } = await supabase.from('mdc_members').select('*').eq('id', user.id).maybeSingle()
  return { supabase, user, membro: (data as Membro | null) ?? null }
}

/**
 * Porteiro da área do membro. Manda cada um para onde deve estar:
 * sem conta → /comprar · sem comprovante → pagamento · aguardando → /aguardando
 * · vencido/cancelado → /renovar · sem diagnóstico → /app/diagnostico.
 */
export async function requireMembro(opcoes: { semDiagnostico?: boolean } = {}) {
  const { supabase, user, membro } = await buscarMembro()
  if (!user) redirect('/entrar?next=/app')
  if (!membro) {
    const { data: ehAdmin } = await supabase.rpc('mdc_is_admin')
    redirect(ehAdmin ? '/admin' : '/comprar')
  }
  const st = statusExibido(membro)
  if (st === 'pendente') redirect('/comprar/pagamento')
  if (st === 'aguardando') redirect('/aguardando')
  if (st === 'vencido' || st === 'cancelado') redirect('/renovar')

  if (!opcoes.semDiagnostico) {
    const { count } = await supabase
      .from('mdc_diagnosticos')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', membro.id)
      .eq('tipo', 'entrada')
    if (!count) redirect('/app/diagnostico')
  }
  return { supabase, user, membro, semana: semanaDoMembro(membro.data_inicio), status: st }
}
