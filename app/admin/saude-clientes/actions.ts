'use server'

import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { classificarSaude } from './criterios'
import type { ClienteSaude } from './types'

type RpcRow = {
  barbearia_id: string
  nome: string
  cidade: string | null
  data_cadastro: string
  email_dono: string | null
  telefone: string | null
  tipo_acesso: string | null
  periodicidade: string | null
  status_assinatura: string | null
  ultimo_login: string | null
  nunca_logou: boolean
  dias_sem_login: number
  ultimo_lancamento_diario: string | null
  nunca_lancou: boolean
  dias_sem_lancamento: number
  quantidade_barbeiros: number
  barbeiros_com_atividade_mes: number
  dias_com_atividade_30: number
}

function nomeDoPlano(row: RpcRow): string {
  const periodo = row.periodicidade === 'anual' ? 'Anual' : 'Mensal'
  if (row.status_assinatura && row.status_assinatura !== 'ativa') {
    return `${periodo} · ${row.status_assinatura}`
  }
  return periodo
}

/**
 * Porta única de leitura do painel. Além da proteção da própria página, a
 * ação revalida a sessão e o e-mail antes de usar o service_role.
 */
export async function listarSaudeClientes(): Promise<{
  rows: ClienteSaude[]
  error?: string
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) {
    return { rows: [], error: 'Sem permissão para acessar este painel.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any).rpc('admin_saude_clientes')
  if (error) {
    console.error('[admin/saude-clientes] erro ao consultar:', error)
    return { rows: [], error: 'Não foi possível carregar a saúde dos clientes.' }
  }

  // Defesa adicional: a função SQL já devolve somente assinantes, mas este
  // filtro impede um vitalício de aparecer caso a consulta seja alterada no
  // futuro sem a mesma restrição.
  const assinantes = ((data ?? []) as RpcRow[]).filter(
    (row) => row.tipo_acesso === 'mensal',
  )

  const rows = assinantes.map((row) => {
    const cliente: ClienteSaude = {
      barbeariaId: row.barbearia_id,
      nome: row.nome,
      cidade: row.cidade,
      dataCadastro: row.data_cadastro,
      emailDono: row.email_dono,
      telefone: row.telefone,
      plano: nomeDoPlano(row),
      tipoAcesso: row.tipo_acesso,
      periodicidade: row.periodicidade,
      statusAssinatura: row.status_assinatura,
      ultimoLogin: row.ultimo_login,
      nuncaLogou: !!row.nunca_logou,
      diasSemLogin: Number(row.dias_sem_login) || 0,
      ultimoLancamentoDiario: row.ultimo_lancamento_diario,
      nuncaLancou: !!row.nunca_lancou,
      diasSemLancamento: Number(row.dias_sem_lancamento) || 0,
      quantidadeBarbeiros: Number(row.quantidade_barbeiros) || 0,
      barbeirosComAtividadeMes: Number(row.barbeiros_com_atividade_mes) || 0,
      diasComAtividade30: Number(row.dias_com_atividade_30) || 0,
      statusSaude: 'atencao',
    }
    cliente.statusSaude = classificarSaude(cliente)
    return cliente
  })

  return { rows }
}
