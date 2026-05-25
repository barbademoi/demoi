import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FeedbackItem from '@/components/FeedbackItem'
import { proximaReuniao } from '@/lib/reuniao'
import { intervalo } from '@/lib/periodos'
import type { FeedbackComProfissional, TipoFeedback } from '@/lib/feedbacks'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id, dia_reuniao, hora_reuniao')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

  const reuniao = proximaReuniao(estabelecimento.dia_reuniao ?? 1, estabelecimento.hora_reuniao ?? '09:00')

  // Feedbacks da semana (resumo + alertas).
  const semana = intervalo('semana')
  const { data: semData } = await supabase
    .from('feedbacks')
    .select('tipo, estrelas')
    .eq('estabelecimento_id', estabelecimento.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())

  const sem = (semData ?? []) as { tipo: TipoFeedback; estrelas: number | null }[]
  const total = sem.length
  const positivos = sem.filter((f) => f.tipo === 'positivo').length
  const negativos = sem.filter((f) => f.tipo === 'negativo').length
  const observacoes = sem.filter((f) => f.tipo === 'observacao').length
  const graves = sem.filter((f) => f.tipo === 'negativo' && f.estrelas === 5).length

  // Últimos 5 feedbacks.
  const { data: ultData } = await supabase
    .from('feedbacks')
    .select('*, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', estabelecimento.id)
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
    .limit(5)
  const ultimos = (ultData ?? []) as unknown as FeedbackComProfissional[]

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* CARD PRÓXIMA REUNIÃO */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">Próxima reunião</p>
            <p className="text-lg font-bold text-text">
              {reuniao.diaLabel}, {reuniao.horaLabel}
            </p>
            <p className="text-sm text-primary font-medium">{reuniao.contagem}</p>
          </div>
          {graves > 0 && (
            <span className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-medium">
              ⚠ {graves} grave{graves > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text">
            {total === 0
              ? 'Nenhum feedback registrado nesta semana ainda.'
              : `${total} feedback${total > 1 ? 's' : ''} esta semana`}
          </p>
          {total > 0 && (
            <p className="text-xs text-text-muted mt-1">
              🟢 {positivos} positivos · 🔴 {negativos} negativos · ⚪ {observacoes} observações
            </p>
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            disabled
            title="Disponível no próximo passo"
            className="btn-secondary w-full opacity-60 cursor-not-allowed"
          >
            Preparar reunião
          </button>
        </div>
      </div>

      {/* BOTÃO PRINCIPAL */}
      <Link
        href="/painel/feedback/novo"
        className="btn-primary w-full text-lg py-6 shadow-md"
      >
        🎤 Registrar feedback
      </Link>

      {/* ÚLTIMOS FEEDBACKS */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-3">Últimos feedbacks</h2>
        {ultimos.length === 0 ? (
          <p className="text-text-muted text-sm">Seus feedbacks vão aparecer aqui.</p>
        ) : (
          <div className="space-y-3">
            {ultimos.map((f) => (
              <FeedbackItem key={f.id} feedback={f} variante="home" />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
