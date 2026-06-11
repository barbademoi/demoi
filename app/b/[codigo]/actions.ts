'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cicloDeData } from '@/lib/ciclo'

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

  revalidatePath('/b/' + params.linkCodigo)
  return { ok: true }
}
