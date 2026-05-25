import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo, semanaRef } from '@/lib/periodos'
import { proximaReuniao } from '@/lib/reuniao'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import ConduzirClient, { type FeedbackSlide } from './ConduzirClient'

export const dynamic = 'force-dynamic'

export default async function ConduzirPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, dia_reuniao, hora_reuniao')
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
  const decisoes = pauta.decisoes ?? {}

  const semana = intervalo('semana')
  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, tipo, estrelas, texto, categoria, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())

  const todos = (fbData ?? []) as unknown as (FeedbackSlide & { escopo: 'individual' | 'equipe' })[]
  const incluidos = todos.filter((f) => (decisoes[f.id] ?? 'incluir') === 'incluir')
  const ind = incluidos.filter((f) => f.escopo === 'individual')
  const positivos = ind.filter((f) => f.tipo === 'positivo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const negativos = ind.filter((f) => f.tipo === 'negativo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const equipe = incluidos.filter((f) => f.escopo === 'equipe')

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome')

  const { data: metasData } = await supabase
    .from('metas_semanais')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('semana_referencia', semanaRef('anterior'))
    .order('created_at')

  const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')

  return (
    <ConduzirClient
      reuniaoId={reuniao.id}
      estabNome={est.nome}
      dataLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={pauta}
      positivos={positivos}
      negativos={negativos}
      equipe={equipe}
      ativos={(ativosData ?? []) as { id: string; nome: string; foto_url: string | null }[]}
      metasPassadas={(metasData ?? []) as MetaSemanal[]}
    />
  )
}
