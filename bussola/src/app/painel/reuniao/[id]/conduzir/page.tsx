import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { semanaRef } from '@/lib/periodos'
import { proximaReuniao, labelPeriodo, labelProximoPeriodo, labelPeriodoAnterior } from '@/lib/cadencia'
import { loadCadenciaConfig, ultimaReuniaoConcluidaIso } from '@/lib/loadCadencia'
import { janelaObservacoesAtual } from '@/lib/janelaObservacoes'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import { principioDaSemana } from '@/lib/principios'
import ConduzirClient, { type ObsItem } from './ConduzirClient'
import ConduzirDiarioClient from './ConduzirDiarioClient'

export const dynamic = 'force-dynamic'

export default async function ConduzirPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const { data: reuniaoData } = await supabase
    .from('reunioes')
    .select('*')
    .eq('id', params.id)
    .eq('estabelecimento_id', est.id)
    .maybeSingle()
  if (!reuniaoData) notFound()
  const reuniao = reuniaoData as Reuniao
  if (reuniao.status === 'concluida') redirect(`/painel/reuniao/${reuniao.id}/resumo`)

  const pauta = (reuniao.pauta as PautaReuniao | null) ?? {}

  const cadCfg = await loadCadenciaConfig(supabase, est.id as string)
  const ultIso = await ultimaReuniaoConcluidaIso(supabase, est.id as string)
  const prox = proximaReuniao(cadCfg, ultIso)
  const periodoLabel = labelPeriodo(cadCfg.cadencia)
  const proximoLabel = labelProximoPeriodo(cadCfg.cadencia)
  const anteriorLabel = labelPeriodoAnterior(cadCfg.cadencia)

  // Janela dinâmica: desde a última reunião concluída.
  const janela = await janelaObservacoesAtual(supabase, est.id as string)

  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, texto, categoria, status, momento_reuniao, sugestao_ia, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', janela.inicio.toISOString())
    .lte('created_at', janela.fim.toISOString())
    .order('created_at', { ascending: false })
  const observacoes = (fbData ?? []) as unknown as ObsItem[]

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome')
  const ativos = (ativosData ?? []) as { id: string; nome: string; foto_url: string | null }[]

  const { data: metasData } = await supabase
    .from('metas_semanais')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('semana_referencia', semanaRef('anterior'))
    .order('created_at')

  const dataLabel = `${prox.diaLabel}, ${prox.horaLabel}`

  // Cadência diária = Modo Reunião simplificado (3 momentos).
  if (cadCfg.cadencia === 'diaria') {
    return (
      <ConduzirDiarioClient
        reuniaoId={reuniao.id}
        estabId={est.id as string}
        dataLabel={dataLabel}
        pautaInicial={pauta}
        observacoes={observacoes}
        ativos={ativos}
        periodoLabel={periodoLabel}
        proximoLabel={proximoLabel}
      />
    )
  }

  const dataRef = new Date()
  const principios: Record<string, string> = {
    abertura: principioDaSemana('abertura', est.id as string, dataRef),
    revisao: principioDaSemana('revisao', est.id as string, dataRef),
    reconhecimento: principioDaSemana('reconhecimento', est.id as string, dataRef),
    equipe: principioDaSemana('equipe', est.id as string, dataRef),
    ajuste: principioDaSemana('ajuste', est.id as string, dataRef),
    encerramento: principioDaSemana('encerramento', est.id as string, dataRef),
  }

  return (
    <ConduzirClient
      reuniaoId={reuniao.id}
      estabId={est.id as string}
      dataLabel={dataLabel}
      pautaInicial={pauta}
      observacoes={observacoes}
      ativos={ativos}
      metasPassadas={(metasData ?? []) as MetaSemanal[]}
      principios={principios}
      periodoLabel={periodoLabel}
      proximoLabel={proximoLabel}
      anteriorLabel={anteriorLabel}
    />
  )
}
