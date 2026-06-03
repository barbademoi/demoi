import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo } from '@/lib/periodos'
import ListaFeedbacksCliente, {
  type ColaboradorLite,
  type FeedbackClienteUI,
} from './ListaFeedbacksCliente'

export const dynamic = 'force-dynamic'

export default async function FeedbacksClientePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, feedback_cliente_ativo')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome')
  const ativos = (ativosData ?? []) as ColaboradorLite[]

  // Tenta com brinde_validade_dias (migration 018); cai sem ela.
  let fbData: unknown[] | null = null
  const tentativaCompleta = await supabase
    .from('feedbacks_cliente')
    .select('id, profissional_id, nome_cliente, identificado, estrelas, comentario, brinde_id, codigo_resgate, brinde_usado, brinde_validade_dias, status, created_at, profissionais(nome, foto_url), brindes(nome)')
    .eq('estabelecimento_id', est.id)
    .order('created_at', { ascending: false })
  if (tentativaCompleta.data) {
    fbData = tentativaCompleta.data
  } else {
    const tentativaMinima = await supabase
      .from('feedbacks_cliente')
      .select('id, profissional_id, nome_cliente, identificado, estrelas, comentario, brinde_id, codigo_resgate, brinde_usado, status, created_at, profissionais(nome, foto_url), brindes(nome)')
      .eq('estabelecimento_id', est.id)
      .order('created_at', { ascending: false })
    fbData = tentativaMinima.data
  }
  const lista = (fbData ?? []) as unknown as FeedbackClienteUI[]

  // Contadores resumidos.
  const semana = intervalo('semana')
  const mes = intervalo('mes')
  const novos = lista.filter((f) => f.status === 'novo').length
  const naSemana = lista.filter((f) => {
    const t = new Date(f.created_at).getTime()
    return t >= semana.inicio.getTime() && t <= semana.fim.getTime()
  }).length
  const noMes = lista.filter((f) => {
    const t = new Date(f.created_at).getTime()
    return t >= mes.inicio.getTime() && t <= mes.fim.getTime()
  }).length
  const media = lista.length
    ? lista.reduce((s, f) => s + (f.estrelas ?? 0), 0) / lista.length
    : 0

  return (
    <ListaFeedbacksCliente
      featureAtiva={!!est.feedback_cliente_ativo}
      contadores={{ novos, naSemana, noMes, media }}
      lista={lista}
      ativos={ativos}
    />
  )
}
