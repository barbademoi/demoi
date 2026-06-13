'use server'

// Server action: importa os barbeiros + comissao_acumulada do ciclo atual
// pra dentro do Controle Financeiro. Cada barbeiro vira/atualiza um
// colaborador tipo 'comissao' (so na Empresa) com o valor do mes.
//
// Retorna lista de barbeiros + comissao do ciclo atual. O lado client mescla
// com os collaborators existentes do state e salva via remoteSave.

import { createClient } from '@/lib/supabase/server'
import { cicloAtual } from '@/lib/ciclo'

interface BarbeiroComissao {
  nome: string
  comissao: number
}

export async function buscarComissoesBarbermeta(): Promise<
  { ok: true; mesAno: string; barbeiros: BarbeiroComissao[] } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(dia_fechamento)')
    .eq('id', user.id).single() as
    { data: { barbearia_id: string; barbearias: { dia_fechamento: number | null } | null } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const diaFechamento = usuario.barbearias?.dia_fechamento ?? 1
  const ciclo = cicloAtual(diaFechamento, new Date())
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  // Barbeiros ativos da barbearia (recepcionistas tambem podem ter comissao,
  // entao nao filtra por tipo — quem nao quiser, ignora no lado do app)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bs } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((bs ?? []) as { id: string; nome: string }[])

  if (barbeiros.length === 0) {
    return { ok: true, mesAno: `${ano}-${String(mes).padStart(2, '0')}`, barbeiros: [] }
  }

  // Comissao acumulada do ciclo atual por barbeiro
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ls } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes).eq('ano', ano)
    .in('barbeiro_id', barbeiros.map(b => b.id))
  const porBarbeiro: Record<string, number> = {}
  for (const r of (ls ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    porBarbeiro[r.barbeiro_id] = Number(r.comissao_acumulada) || 0
  }

  const out: BarbeiroComissao[] = barbeiros.map(b => ({
    nome: b.nome,
    comissao: porBarbeiro[b.id] ?? 0,
  }))

  return { ok: true, mesAno: `${ano}-${String(mes).padStart(2, '0')}`, barbeiros: out }
}
