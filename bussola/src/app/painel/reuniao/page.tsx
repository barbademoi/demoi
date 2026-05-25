import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { calcularPlacar } from '@/lib/feedbacks'
import { intervalo, intervaloAnterior, semanaRef } from '@/lib/periodos'
import { proximaReuniao } from '@/lib/reuniao'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import PrepararClient, { type Alerta, type FeedbackSemana, type ProfLite } from './PrepararClient'

export const dynamic = 'force-dynamic'

export default async function PrepararReuniaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, dia_reuniao, hora_reuniao')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

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
  const semanaAnt = intervaloAnterior('semana')

  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, tipo, estrelas, texto, categoria, created_at, status, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semanaAnt.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
    .order('created_at', { ascending: false })

  type FbRange = FeedbackSemana & { status: string }
  const range = (fbData ?? []) as unknown as FbRange[]
  const noIntervalo = (f: FbRange, iv: { inicio: Date; fim: Date }) => {
    const t = new Date(f.created_at).getTime()
    return t >= iv.inicio.getTime() && t <= iv.fim.getTime()
  }
  const fbSemana = range.filter((f) => noIntervalo(f, semana))

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome')
  const ativos = (ativosData ?? []) as ProfLite[]

  // Placar por profissional (semana e semana anterior).
  const placarSem: Record<string, number> = {}
  const placarAnt: Record<string, number> = {}
  for (const p of ativos) {
    const seus = range.filter((f) => f.profissional_id === p.id)
    placarSem[p.id] = calcularPlacar(seus.filter((f) => noIntervalo(f, semana)))
    placarAnt[p.id] = calcularPlacar(seus.filter((f) => noIntervalo(f, semanaAnt)))
  }

  // Alertas.
  const alertas: Alerta[] = []
  for (const p of ativos) {
    const seus = fbSemana.filter((f) => f.profissional_id === p.id)
    const graves = seus.filter((f) => f.tipo === 'negativo' && (f.estrelas ?? 0) >= 4)
    const positivos = seus.filter((f) => f.tipo === 'positivo')
    const negativos = seus.filter((f) => f.tipo === 'negativo')
    const razoes: string[] = []
    let grave = false
    if (graves.length >= 2) {
      razoes.push(`${graves.length} feedbacks graves nesta semana`)
      grave = true
    }
    if ((placarSem[p.id] ?? 0) < 0) razoes.push('Placar negativo na semana')
    if (positivos.length === 0 && seus.length > 0) razoes.push('Nenhum elogio nesta semana')
    if (razoes.length === 0) continue
    alertas.push({
      profId: p.id,
      nome: p.nome,
      foto_url: p.foto_url,
      grave,
      razoes,
      sugestao: grave ? 'Conversar em particular antes da reunião' : 'Verificar se está tudo bem',
      feedbackIds: negativos.map((f) => f.id),
    })
  }

  // Métricas.
  const total = fbSemana.length
  const positivos = fbSemana.filter((f) => f.tipo === 'positivo').length
  const negativos = fbSemana.filter((f) => f.tipo === 'negativo').length
  const observacoes = fbSemana.filter((f) => f.tipo === 'observacao').length

  let maiorPlacar = { nome: '—', valor: 0 }
  let maisEvoluiu = { nome: '—', delta: 0 }
  for (const p of ativos) {
    if ((placarSem[p.id] ?? 0) > maiorPlacar.valor || maiorPlacar.nome === '—') {
      maiorPlacar = { nome: p.nome, valor: placarSem[p.id] ?? 0 }
    }
    const delta = (placarSem[p.id] ?? 0) - (placarAnt[p.id] ?? 0)
    if (delta > maisEvoluiu.delta || maisEvoluiu.nome === '—') {
      maisEvoluiu = { nome: p.nome, delta }
    }
  }

  // Metas da semana passada.
  const { data: metasPassadasData } = await supabase
    .from('metas_semanais')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('semana_referencia', semanaRef('anterior'))
    .order('created_at')
  const metasPassadas = (metasPassadasData ?? []) as MetaSemanal[]

  const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')

  return (
    <PrepararClient
      reuniaoId={reuniao!.id}
      dataReuniaoLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={(reuniao!.pauta as PautaReuniao | null) ?? {}}
      feedbacks={fbSemana.map((f) => ({
        id: f.id,
        profissional_id: f.profissional_id,
        tipo: f.tipo,
        estrelas: f.estrelas,
        texto: f.texto,
        categoria: f.categoria,
        created_at: f.created_at,
        profissionais: f.profissionais,
      }))}
      alertas={alertas}
      metasPassadas={metasPassadas}
      ativos={ativos}
      metricas={{
        total,
        positivos,
        negativos,
        observacoes,
        maiorPlacar,
        maisEvoluiu,
      }}
    />
  )
}
