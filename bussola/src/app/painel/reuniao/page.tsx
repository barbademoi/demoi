import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { proximaReuniao } from '@/lib/cadencia'
import { loadCadenciaConfig, ultimaReuniaoConcluidaIso } from '@/lib/loadCadencia'
import type { PautaReuniao, Reuniao } from '@/lib/pauta'
import PrepararClient, { type FbClienteSemana, type ObsSemana } from './PrepararClient'

export const dynamic = 'force-dynamic'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default async function PrepararReuniaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, config_ia')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const mostrarResumo = (est.config_ia as { resumo_semana?: boolean } | null)?.resumo_semana !== false

  const cadCfg = await loadCadenciaConfig(supabase, est.id as string)
  const ultIso = await ultimaReuniaoConcluidaIso(supabase, est.id as string)
  const prox = proximaReuniao(cadCfg, ultIso)

  // Reunião planejada mais próxima; cria se não existir.
  let reuniao: Reuniao | null = null
  const { data: planejada } = await supabase
    .from('reunioes')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'planejada')
    .gte('data_reuniao', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('data_reuniao', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (planejada) {
    reuniao = planejada as Reuniao
  } else {
    const { data: nova } = await supabase
      .from('reunioes')
      .insert({ estabelecimento_id: est.id, data_reuniao: prox.data.toISOString(), status: 'planejada' })
      .select('*')
      .single()
    reuniao = nova as Reuniao
  }

  // Observações pendentes (status='pendente'), sem filtro de data — mais
  // antigas primeiro pra dono lembrar do contexto.
  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, texto, categoria, momento_reuniao, created_at, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'pendente')
    .is('deletado_em', null)
    .order('created_at', { ascending: true })
  const observacoes = (fbData ?? []) as unknown as ObsSemana[]

  // Feedbacks de cliente ainda não compartilhados/arquivados, sem filtro de data.
  let fbCliente: FbClienteSemana[] = []
  try {
    const { data: fcData } = await supabase
      .from('feedbacks_cliente')
      .select('id, profissional_id, estrelas, comentario, created_at, profissionais(nome, foto_url), status')
      .eq('estabelecimento_id', est.id)
      .in('status', ['novo', 'lido'])
      .order('created_at', { ascending: true })
    fbCliente = (fcData ?? []) as unknown as FbClienteSemana[]
  } catch {
    fbCliente = []
  }

  // Contexto pro label: desde a última reunião concluída ou desde o início.
  let contextoLabel = 'pendentes'
  if (ultIso) {
    const d = new Date(ultIso)
    contextoLabel = `desde a última reunião (${d.getDate()} de ${MESES[d.getMonth()]})`
  }

  return (
    <PrepararClient
      reuniaoId={reuniao!.id}
      dataReuniaoLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={(reuniao!.pauta as PautaReuniao | null) ?? {}}
      observacoes={observacoes}
      feedbacksCliente={fbCliente}
      mostrarResumo={mostrarResumo}
      periodoLabel={contextoLabel}
      primeiraReuniao={!ultIso}
    />
  )
}
