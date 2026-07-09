'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cicloDeData, cicloAtual, hojeBrasil } from '@/lib/ciclo'
import { dataLocalStr } from '@/lib/utils'

// Valida que uma data ('YYYY-MM-DD') cai no CICLO ATUAL e não é futura — no
// fuso America/Sao_Paulo. Bloqueia retroativo em ciclo já fechado/anterior.
function dataNoCicloAtual(dataIso: string, diaFechamento: number): { ok: boolean; erro?: string } {
  const hoje = hojeBrasil()
  const hojeIso = dataLocalStr(hoje)
  const atual = cicloAtual(diaFechamento, hoje)
  if (dataIso > hojeIso) return { ok: false, erro: 'Não dá pra lançar um dia no futuro.' }
  if (dataIso < atual.inicioIso) return { ok: false, erro: 'Esse dia é de um ciclo já fechado. Só dá pra lançar dias do ciclo atual.' }
  return { ok: true }
}

export async function marcarCelebracaoExibida(
  barbeiro_id: string,
  mes: number,
  ano: number,
  tier: string,
) {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('celebracoes')
    .upsert({ barbeiro_id, mes, ano, tier }, { onConflict: 'barbeiro_id,mes,ano,tier' })
}

interface ServicoLancado { servico_id: string; quantidade: number }

export async function lancarDiaBarbeiro(params: {
  linkCodigo: string
  data: string            // 'YYYY-MM-DD'
  servicos: ServicoLancado[]
  lancado_por?: 'dono' | 'barbeiro'
}) {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiroRaw } = await (supabase as any)
    .from('barbeiros').select('id, barbearia_id, barbearias(dia_fechamento)')
    .eq('link_codigo', params.linkCodigo).eq('ativo', true).single()
  if (!barbeiroRaw) return { error: 'Barbeiro não encontrado.' }

  // mes/ano = início do ciclo que contém a data, respeitando o dia_fechamento
  // personalizado da barbearia. NÃO usar getMonth() direto — quebra em barbearias
  // com ciclo cruzando meses calendário (ex: dia 26 ao 25).
  const diaFechamento = (barbeiroRaw as { barbearias?: { dia_fechamento: number | null } | null })
    .barbearias?.dia_fechamento ?? 1
  const ciclo = cicloDeData(new Date(params.data + 'T12:00:00'), diaFechamento)
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  // Retroativo seguro: só dias do ciclo atual (não futuro, não ciclo fechado).
  // Vale pro lançamento normal (hoje) e pro retroativo — mesma régua BRT.
  const guard = dataNoCicloAtual(params.data, diaFechamento)
  if (!guard.ok) return { error: guard.erro }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campRaw } = await (supabase as any)
    .from('campanha').select('id, ativo, quem_lanca')
    .eq('barbearia_id', barbeiroRaw.barbearia_id).eq('mes', mes).eq('ano', ano).single()
  if (!campRaw) return { error: 'Campanha não encontrada para este mês.' }
  if (campRaw.ativo === false) return { error: 'Campanha inativa.' }
  // Bloqueio no servidor: se a campanha foi configurada pra "só o dono lança",
  // recusa qualquer lançamento vindo dessa action (chamada pela tela do barbeiro).
  // O dono lança pelo caminho `lancarDiaComoDono` em /dashboard/lancamentos-barbeiro.
  if ((campRaw as { quem_lanca?: string }).quem_lanca === 'dono') {
    return { error: 'Lançamento bloqueado: só o dono lança a pontuação nessa campanha.' }
  }

  const campanha_id = (campRaw as { id: string }).id
  const barbeiro_id = (barbeiroRaw as { id: string }).id
  const lancado_por = params.lancado_por ?? 'barbeiro'

  for (const s of params.servicos) {
    if (s.quantidade <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .delete()
        .eq('barbeiro_id', barbeiro_id)
        .eq('data', params.data)
        .eq('servico_id', s.servico_id)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .upsert({
          barbeiro_id,
          campanha_id,
          data: params.data,
          servico_id: s.servico_id,
          quantidade: s.quantidade,
          lancado_por,
        }, { onConflict: 'barbeiro_id,data,servico_id' })
    }
  }

  // Lançou o dia → limpa qualquer marcação de "não pontuei" desse dia (via
  // admin, pois a tabela tem RLS só-dono). Escopado pelo barbeiro do link.
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('dias_sem_pontuacao')
    .delete().eq('barbeiro_id', barbeiro_id).eq('data', params.data)

  revalidatePath('/b/' + params.linkCodigo)
  return { ok: true }
}

// Resolve o barbeiro pelo link secreto (admin) — base das ações abaixo.
async function resolverBarbeiroPorLink(linkCodigo: string) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('barbeiros')
    .select('id, barbearia_id, barbearias(dia_fechamento)')
    .eq('link_codigo', linkCodigo).eq('ativo', true).single()
  return data as { id: string; barbearia_id: string; barbearias: { dia_fechamento: number | null } | null } | null
}

// Barbeiro marca um dia como "não pontuei" (intencional). Para o alerta desse
// dia. Só dias do ciclo atual. Escopo estrito por barbeiro do link.
export async function marcarNaoPontuei(linkCodigo: string, data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: 'Data inválida.' }
  const barb = await resolverBarbeiroPorLink(linkCodigo)
  if (!barb) return { error: 'Barbeiro não encontrado.' }
  const diaFechamento = barb.barbearias?.dia_fechamento ?? 1
  const guard = dataNoCicloAtual(data, diaFechamento)
  if (!guard.ok) return { error: guard.erro }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('dias_sem_pontuacao')
    .upsert({ barbearia_id: barb.barbearia_id, barbeiro_id: barb.id, data }, { onConflict: 'barbeiro_id,data' })
  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/b/' + linkCodigo)
  return { ok: true }
}

// Reabre um dia marcado como "não pontuei" (reversível) — volta a ser um dia
// em aberto que o barbeiro pode lançar.
export async function reabrirDia(linkCodigo: string, data: string) {
  const barb = await resolverBarbeiroPorLink(linkCodigo)
  if (!barb) return { error: 'Barbeiro não encontrado.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('dias_sem_pontuacao')
    .delete().eq('barbeiro_id', barb.id).eq('data', data)
  if (error) return { error: 'Erro ao reabrir.' }

  revalidatePath('/b/' + linkCodigo)
  return { ok: true }
}
