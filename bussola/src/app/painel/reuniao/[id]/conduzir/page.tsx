import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo, intervaloAnterior, semanaRef } from '@/lib/periodos'
import { proximaReuniao } from '@/lib/reuniao'
import { calcularPlacar, type Feedback } from '@/lib/feedbacks'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import ConduzirClient, { type FbItem } from './ConduzirClient'

export const dynamic = 'force-dynamic'

export default async function ConduzirPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, dia_reuniao, hora_reuniao, config_ia')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const mostrarDicas = (est.config_ia as { dicas_blocos?: boolean } | null)?.dicas_blocos !== false

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

  const semana = intervalo('semana')
  const semanaAnt = intervaloAnterior('semana')

  // Feedbacks da semana (todos, não só os "incluir") com status e sugestão.
  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, tipo, estrelas, texto, categoria, status, sugestao_ia, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
    .order('created_at', { ascending: false })
  const todos = (fbData ?? []) as unknown as FbItem[]

  const ind = todos.filter((f) => f.escopo === 'individual')
  const positivos = ind.filter((f) => f.tipo === 'positivo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const negativos = ind.filter((f) => f.tipo === 'negativo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const observacoes = ind.filter((f) => f.tipo === 'observacao')
  const equipe = todos.filter((f) => f.escopo === 'equipe')

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

  // Métricas: placar por profissional (semana e semana anterior).
  const { data: rangeData } = await supabase
    .from('feedbacks')
    .select('profissional_id, tipo, estrelas, created_at')
    .eq('estabelecimento_id', est.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .gte('created_at', semanaAnt.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
  const range = (rangeData ?? []) as { profissional_id: string; tipo: Feedback['tipo']; estrelas: number | null; created_at: string }[]
  const dentro = (iso: string, iv: { inicio: Date; fim: Date }) => {
    const t = new Date(iso).getTime()
    return t >= iv.inicio.getTime() && t <= iv.fim.getTime()
  }
  let maiorPlacar = { nome: '—', valor: 0 }
  let maisEvoluiu = { nome: '—', delta: 0 }
  for (const p of ativos) {
    const seus = range.filter((f) => f.profissional_id === p.id)
    const sem = calcularPlacar(seus.filter((f) => dentro(f.created_at, semana)))
    const ant = calcularPlacar(seus.filter((f) => dentro(f.created_at, semanaAnt)))
    if (sem > maiorPlacar.valor || maiorPlacar.nome === '—') maiorPlacar = { nome: p.nome, valor: sem }
    if (sem - ant > maisEvoluiu.delta || maisEvoluiu.nome === '—') maisEvoluiu = { nome: p.nome, delta: sem - ant }
  }

  const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')

  return (
    <ConduzirClient
      reuniaoId={reuniao.id}
      dataLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={pauta}
      positivos={positivos}
      negativos={negativos}
      observacoes={observacoes}
      equipe={equipe}
      ativos={ativos}
      metasPassadas={(metasData ?? []) as MetaSemanal[]}
      metricas={{
        total: todos.length,
        positivos: todos.filter((f) => f.tipo === 'positivo').length,
        negativos: todos.filter((f) => f.tipo === 'negativo').length,
        observacoes: todos.filter((f) => f.tipo === 'observacao').length,
        maiorPlacar,
        maisEvoluiu,
      }}
      mostrarDicas={mostrarDicas}
    />
  )
}
