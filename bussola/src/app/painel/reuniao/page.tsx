import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo } from '@/lib/periodos'
import { proximaReuniao } from '@/lib/reuniao'
import type { PautaReuniao, Reuniao } from '@/lib/pauta'
import PrepararClient, { type ObsSemana } from './PrepararClient'

export const dynamic = 'force-dynamic'

export default async function PrepararReuniaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, dia_reuniao, hora_reuniao, config_ia')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const mostrarResumo = (est.config_ia as { resumo_semana?: boolean } | null)?.resumo_semana !== false

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
    const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')
    const { data: nova } = await supabase
      .from('reunioes')
      .insert({ estabelecimento_id: est.id, data_reuniao: prox.data.toISOString(), status: 'planejada' })
      .select('*')
      .single()
    reuniao = nova as Reuniao
  }

  const semana = intervalo('semana')

  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, texto, categoria, momento_reuniao, created_at, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
    .order('created_at', { ascending: false })
  const observacoes = (fbData ?? []) as unknown as ObsSemana[]

  const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')

  return (
    <PrepararClient
      reuniaoId={reuniao!.id}
      dataReuniaoLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={(reuniao!.pauta as PautaReuniao | null) ?? {}}
      observacoes={observacoes}
      mostrarResumo={mostrarResumo}
    />
  )
}
