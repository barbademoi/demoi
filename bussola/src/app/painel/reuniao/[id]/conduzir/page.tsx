import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { intervalo, semanaRef } from '@/lib/periodos'
import { proximaReuniao } from '@/lib/reuniao'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import { principioDaSemana } from '@/lib/principios'
import ConduzirClient, { type ObsItem } from './ConduzirClient'

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

  const semana = intervalo('semana')

  // Observações da semana (com momento_reuniao classificado, se já houve preparação).
  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, escopo, texto, categoria, status, momento_reuniao, sugestao_ia, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
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

  const prox = proximaReuniao(est.dia_reuniao ?? 1, est.hora_reuniao ?? '09:00')

  // Princípios pré-curados (rotativos por semana).
  const dataRef = new Date()
  const principios: Record<string, string> = {
    abertura: principioDaSemana('abertura', est.id, dataRef),
    revisao: principioDaSemana('revisao', est.id, dataRef),
    reconhecimento: principioDaSemana('reconhecimento', est.id, dataRef),
    equipe: principioDaSemana('equipe', est.id, dataRef),
    ajuste: principioDaSemana('ajuste', est.id, dataRef),
    encerramento: principioDaSemana('encerramento', est.id, dataRef),
  }

  return (
    <ConduzirClient
      reuniaoId={reuniao.id}
      estabId={est.id}
      dataLabel={`${prox.diaLabel}, ${prox.horaLabel}`}
      pautaInicial={pauta}
      observacoes={observacoes}
      ativos={ativos}
      metasPassadas={(metasData ?? []) as MetaSemanal[]}
      principios={principios}
    />
  )
}
