import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { spPartsOf } from '@/lib/tz'
import type { PautaReuniao, Reuniao } from '@/lib/pauta'

export const dynamic = 'force-dynamic'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function dataLabel(iso: string): string {
  const p = spPartsOf(new Date(iso))
  return `${p.day} de ${MESES[p.m]} de ${p.y}`
}

export default async function HistoricoReunioesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase.from('estabelecimentos').select('id').eq('dono_id', user.id).maybeSingle()
  if (!est) redirect('/onboarding')

  const { data } = await supabase
    .from('reunioes')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'concluida')
    .order('data_reuniao', { ascending: false })
  const reunioes = (data ?? []) as Reuniao[]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-5">Histórico de reuniões</h1>

      {reunioes.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhuma reunião concluída ainda.</p>
      ) : (
        <div className="space-y-3">
          {reunioes.map((r) => {
            const pauta = (r.pauta as PautaReuniao | null) ?? {}
            const discutidos = Object.values(pauta.decisoes ?? {}).filter((d) => d === 'incluir').length
            const metas = (pauta.novasMetas ?? []).filter((m) => m.texto.trim()).length
            return (
              <Link
                key={r.id}
                href={`/painel/reuniao/${r.id}/resumo`}
                className="card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="font-medium text-text">{dataLabel(r.data_reuniao)}</p>
                  <p className="text-xs text-text-muted">
                    {r.duracao_minutos ? `${r.duracao_minutos} min · ` : ''}{discutidos} feedbacks · {metas} metas
                  </p>
                </div>
                <span className="text-text-muted">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
