import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FeedbackItem from '@/components/FeedbackItem'
import AtividadeItem, { type AtividadeFb } from '@/components/AtividadeItem'
import MarcarVisto from './MarcarVisto'
import { proximaReuniao } from '@/lib/reuniao'
import { intervalo } from '@/lib/periodos'
import { calcularPlacar, comSinal, type Feedback, type FeedbackComProfissional, type TipoFeedback } from '@/lib/feedbacks'

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

  // Reunião pendente (planejada e já passou da data).
  const { data: pendente } = await supabase
    .from('reunioes')
    .select('id')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('status', 'planejada')
    .lt('data_reuniao', new Date().toISOString())
    .order('data_reuniao', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Proximidade → cor do card.
  const dias = reuniao.contagem === 'Hoje!' ? 0 : reuniao.contagem === 'Amanhã' ? 1 : parseInt(reuniao.contagem.replace(/\D/g, ''), 10) || 9
  const cardClasse = pendente
    ? 'border-red-300 bg-red-50'
    : dias === 0
      ? 'border-orange-300 bg-orange-50'
      : dias <= 2
        ? 'border-amber-300 bg-amber-50'
        : 'border-border bg-surface'

  // Feedbacks da semana (resumo + alertas).
  const semana = intervalo('semana')
  const { data: semData } = await supabase
    .from('feedbacks')
    .select('tipo, estrelas')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())

  const sem = (semData ?? []) as { tipo: TipoFeedback; estrelas: number | null }[]
  const total = sem.length
  const positivos = sem.filter((f) => f.tipo === 'positivo').length
  const negativos = sem.filter((f) => f.tipo === 'negativo').length
  const observacoes = sem.filter((f) => f.tipo === 'observacao').length
  const graves = sem.filter((f) => f.tipo === 'negativo' && f.estrelas === 5).length

  // Últimos 5 feedbacks individuais.
  const { data: ultData } = await supabase
    .from('feedbacks')
    .select('*, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
    .limit(5)
  const ultimos = (ultData ?? []) as unknown as FeedbackComProfissional[]

  // Placar da equipe (independente dos placares individuais).
  const mes = intervalo('mes')
  const { data: eqData } = await supabase
    .from('feedbacks')
    .select('tipo, estrelas, texto, created_at')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('escopo', 'equipe')
    .is('deletado_em', null)
    .gte('created_at', mes.inicio.toISOString())
    .order('created_at', { ascending: false })
  const eq = (eqData ?? []) as { tipo: TipoFeedback; estrelas: number | null; texto: string; created_at: string }[]
  const eqSemana = eq.filter((f) => new Date(f.created_at).getTime() >= semana.inicio.getTime())
  const placarEqSemana = calcularPlacar(eqSemana as Feedback[])
  const placarEqMes = calcularPlacar(eq as Feedback[])
  const corEq = (v: number) => (v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : 'text-amber-600')

  // Atividade da equipe (leituras e respostas).
  const { data: atvData } = await supabase
    .from('feedbacks')
    .select('id, texto, lido_em, resposta_profissional, resposta_em, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', estabelecimento.id)
    .not('lido_em', 'is', null)
    .order('lido_em', { ascending: false })
    .limit(30)
  const atividade = ((atvData ?? []) as unknown as AtividadeFb[])
    .sort((a, b) => {
      const ta = Math.max(Date.parse(a.resposta_em ?? a.lido_em ?? '0') || 0, Date.parse(a.lido_em ?? '0') || 0)
      const tb = Math.max(Date.parse(b.resposta_em ?? b.lido_em ?? '0') || 0, Date.parse(b.lido_em ?? '0') || 0)
      return tb - ta
    })
    .slice(0, 10)

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* CARD PRÓXIMA REUNIÃO */}
      <div className={`rounded-2xl border p-5 ${cardClasse}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            {pendente ? (
              <>
                <p className="text-sm font-bold text-red-700">Reunião pendente</p>
                <p className="text-sm text-text mt-0.5">Marque como concluída ou reagende.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-text-muted">{dias === 0 ? '🔔 Reunião HOJE' : 'Próxima reunião'}</p>
                <p className="text-lg font-bold text-text">{reuniao.diaLabel}, {reuniao.horaLabel}</p>
                <p className="text-sm text-primary font-medium">{reuniao.contagem}</p>
              </>
            )}
          </div>
          {graves > 0 && (
            <span className="bg-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-medium">
              ⚠ {graves} grave{graves > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border/60">
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

        <Link href="/painel/reuniao" className="btn-primary w-full mt-4">
          {pendente ? 'Resolver reunião' : dias === 0 ? 'Preparar agora' : 'Preparar reunião'}
        </Link>
      </div>

      {/* BOTÕES DE REGISTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/painel/feedback/novo" className="btn-primary w-full py-5 shadow-md">
          🎯 Registrar feedback
        </Link>
        <Link href="/painel/feedback/novo?escopo=equipe" className="btn-secondary w-full py-5 shadow-sm">
          👥 Registrar para a equipe
        </Link>
      </div>

      {/* PLACAR DA EQUIPE */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-text">👥 Equipe</h2>
          <Link href="/painel/feedbacks-equipe" className="text-sm text-primary font-medium">Ver todos</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-text-muted">Semana</p>
            <p className={`text-3xl font-bold ${corEq(placarEqSemana)}`}>{comSinal(placarEqSemana)}</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-text-muted">Mês</p>
            <p className={`text-3xl font-bold ${corEq(placarEqMes)}`}>{comSinal(placarEqMes)}</p>
          </div>
        </div>
        {eq.length > 0 && (
          <ul className="mt-3 space-y-1">
            {eq.slice(0, 3).map((f, i) => (
              <li key={i} className="text-xs text-text-muted truncate">
                • {f.texto.length > 50 ? `${f.texto.slice(0, 50)}…` : f.texto}
              </li>
            ))}
          </ul>
        )}
      </div>

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

      {/* ATIVIDADE DA EQUIPE */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-text">📬 Atividade da equipe</h2>
          {atividade.length > 0 && (
            <Link href="/painel/atividade" className="text-sm text-primary font-medium">Ver tudo</Link>
          )}
        </div>
        {atividade.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhuma confirmação de leitura ainda.</p>
        ) : (
          <div className="space-y-2">
            {atividade.map((a) => <AtividadeItem key={a.id} a={a} />)}
          </div>
        )}
      </section>

      <MarcarVisto />
    </main>
  )
}
