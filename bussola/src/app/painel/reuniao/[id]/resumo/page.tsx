import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { spPartsOf } from '@/lib/tz'
import type { MetaSemanal, PautaReuniao, Reuniao } from '@/lib/pauta'
import ImprimirBtn from './ImprimirBtn'

export const dynamic = 'force-dynamic'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function dataLonga(iso: string): string {
  const p = spPartsOf(new Date(iso))
  return `${p.day} de ${MESES[p.m]}`
}

export default async function ResumoReuniaoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase.from('estabelecimentos').select('id').eq('dono_id', user.id).maybeSingle()
  if (!est) redirect('/onboarding')

  const { data: reuniaoData } = await supabase
    .from('reunioes')
    .select('*')
    .eq('id', params.id)
    .eq('estabelecimento_id', est.id)
    .maybeSingle()
  if (!reuniaoData) notFound()
  const reuniao = reuniaoData as Reuniao
  const pauta = (reuniao.pauta as PautaReuniao | null) ?? {}

  const { data: metasData } = await supabase
    .from('metas_semanais')
    .select('*')
    .eq('reuniao_id', reuniao.id)
    .order('created_at')
  const metas = (metasData ?? []) as MetaSemanal[]

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome')
    .eq('estabelecimento_id', est.id)
  const nomeProf = (id: string | null) => (id ? (ativosData ?? []).find((a) => a.id === id)?.nome ?? '—' : 'Geral')

  const presentesNomes = (pauta.presentes ?? []).map((id) => nomeProf(id)).filter((n) => n !== '—')
  const discutidos = Object.values(pauta.decisoes ?? {}).filter((d) => d === 'incluir').length

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <Link href="/painel/historico-reunioes" className="text-sm text-text-muted hover:text-primary print:hidden">
        ← Histórico
      </Link>

      <div className="card p-5">
        <h1 className="text-xl font-bold text-text">Reunião de {dataLonga(reuniao.data_reuniao)} — Concluída</h1>
        <p className="text-text-muted text-sm mt-1">
          {reuniao.duracao_minutos ? `Duração: ${reuniao.duracao_minutos} min · ` : ''}
          {discutidos} feedbacks discutidos · {metas.length} metas
        </p>
      </div>

      {presentesNomes.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-text mb-2">Presentes</h2>
          <p className="text-sm text-text">{presentesNomes.join(', ')}</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold text-text mb-2">Metas definidas</h2>
        {metas.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhuma meta definida.</p>
        ) : (
          <ul className="space-y-2">
            {metas.map((m) => (
              <li key={m.id} className="text-sm text-text">
                • {m.texto} <span className="text-text-muted">({nomeProf(m.responsavel_id)})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pauta.metricasNotas && (
        <div className="card p-5">
          <h2 className="font-semibold text-text mb-2">Anotações de métricas</h2>
          <p className="text-sm text-text whitespace-pre-wrap">{pauta.metricasNotas}</p>
        </div>
      )}

      {reuniao.anotacoes && (
        <div className="card p-5">
          <h2 className="font-semibold text-text mb-2">Anotações</h2>
          <p className="text-sm text-text whitespace-pre-wrap">{reuniao.anotacoes}</p>
        </div>
      )}

      <ImprimirBtn />
    </main>
  )
}
