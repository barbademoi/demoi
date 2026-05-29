import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, AlertTriangle, MessageSquarePlus, Users, Inbox, Star } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import FeedbackItem from '@/components/FeedbackItem'
import AtividadeItem, { type AtividadeFb } from '@/components/AtividadeItem'
import MarcarVisto from './MarcarVisto'
import { proximaReuniao } from '@/lib/reuniao'
import { intervalo } from '@/lib/periodos'
import type { FeedbackComProfissional } from '@/lib/feedbacks'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  // Tenta select completo; se feedback_cliente_ativo ainda não existir
  // (migration 012 não rodada), cai pra mínimo sem feature.
  let estabelecimento: { id: string; dia_reuniao: number | null; hora_reuniao: string | null; feedback_cliente_ativo: boolean }
  const completo = await supabase
    .from('estabelecimentos')
    .select('id, dia_reuniao, hora_reuniao, feedback_cliente_ativo')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (completo.data) {
    estabelecimento = {
      id: completo.data.id as string,
      dia_reuniao: completo.data.dia_reuniao as number | null,
      hora_reuniao: completo.data.hora_reuniao as string | null,
      feedback_cliente_ativo: !!completo.data.feedback_cliente_ativo,
    }
  } else {
    const minimo = await supabase
      .from('estabelecimentos')
      .select('id, dia_reuniao, hora_reuniao')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!minimo.data) redirect('/onboarding')
    estabelecimento = {
      id: minimo.data.id as string,
      dia_reuniao: minimo.data.dia_reuniao as number | null,
      hora_reuniao: minimo.data.hora_reuniao as string | null,
      feedback_cliente_ativo: false,
    }
  }

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

  // Proximidade → acento na borda esquerda do card (sem fundos saturados).
  const dias = reuniao.contagem === 'Hoje!' ? 0 : reuniao.contagem === 'Amanhã' ? 1 : parseInt(reuniao.contagem.replace(/\D/g, ''), 10) || 9
  const cardClasse = pendente
    ? 'border-border border-l-[3px] border-l-vinho'
    : dias === 0
      ? 'border-border border-l-[3px] border-l-ambar'
      : dias <= 2
        ? 'border-border border-l-[3px] border-l-marrom'
        : 'border-border'

  // Feedbacks da semana (resumo + alertas).
  const semana = intervalo('semana')
  const { data: semData } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())

  const total = (semData ?? []).length
  const graves = 0

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
    .select('texto, created_at')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('escopo', 'equipe')
    .is('deletado_em', null)
    .gte('created_at', mes.inicio.toISOString())
    .order('created_at', { ascending: false })
  const eq = (eqData ?? []) as { texto: string; created_at: string }[]

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

  // Resumo de feedbacks de cliente (se a feature está ativa).
  let resumoCliente: { totalSemana: number; media: number; novos: number } | null = null
  if (estabelecimento.feedback_cliente_ativo) {
    const { data: fcData } = await supabase
      .from('feedbacks_cliente')
      .select('estrelas, status, created_at')
      .eq('estabelecimento_id', estabelecimento.id)
      .gte('created_at', semana.inicio.toISOString())
      .lte('created_at', semana.fim.toISOString())
    const fc = (fcData ?? []) as { estrelas: number; status: string }[]
    const novos = fc.filter((f) => f.status === 'novo').length
    const media = fc.length ? fc.reduce((s, f) => s + (f.estrelas ?? 0), 0) / fc.length : 0
    resumoCliente = { totalSemana: fc.length, media, novos }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* CARD PRÓXIMA REUNIÃO */}
      <div className={`rounded-lg border p-5 bg-surface shadow-suave ${cardClasse}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            {pendente ? (
              <>
                <p className="text-sm font-bold text-vinho">Reunião pendente</p>
                <p className="text-sm text-text mt-0.5">Marque como concluída ou reagende.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-chumbo inline-flex items-center gap-1">
                  {dias === 0 && <Bell size={14} strokeWidth={1.5} color="#A56336" />}
                  {dias === 0 ? 'Reunião HOJE' : 'Próxima reunião'}
                </p>
                <p className="text-lg font-bold text-text">{reuniao.diaLabel}, {reuniao.horaLabel}</p>
                <p className="text-sm text-marrom font-medium">{reuniao.contagem}</p>
              </>
            )}
          </div>
          {graves > 0 && (
            <span className="inline-flex items-center gap-1 bg-vinho/10 text-vinho rounded-full px-3 py-1 text-xs font-medium">
              <AlertTriangle size={14} strokeWidth={1.5} /> {graves} grave{graves > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text">
            {total === 0
              ? 'Nenhuma observação registrada nesta semana ainda.'
              : `${total} observa${total > 1 ? 'ções' : 'ção'} esta semana`}
          </p>
        </div>

        <Link href="/painel/reuniao" className="btn-primary w-full mt-4">
          {pendente ? 'Resolver reunião' : dias === 0 ? 'Preparar agora' : 'Preparar reunião'}
        </Link>
      </div>

      {/* FEEDBACK DE CLIENTES (se feature ativa) */}
      {resumoCliente && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold text-text inline-flex items-center gap-2">
              <Star size={18} strokeWidth={1.5} color="#8B6F47" fill="#8B6F47" /> Feedback de clientes
            </h2>
            <Link href="/painel/feedbacks-cliente" className="text-sm text-marrom font-medium">Ver todos</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-chumbo">Esta semana</p>
              <p className="text-2xl font-semibold text-text">{resumoCliente.totalSemana}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-chumbo">Média</p>
              <p className="text-2xl font-semibold text-text inline-flex items-center gap-1">
                {resumoCliente.media.toFixed(1)}
                <Star size={14} strokeWidth={1.5} fill="#8B6F47" color="#8B6F47" />
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-chumbo">Não lidos</p>
              <p className={`text-2xl font-semibold ${resumoCliente.novos > 0 ? 'text-marrom' : 'text-text'}`}>{resumoCliente.novos}</p>
            </div>
          </div>
        </div>
      )}

      {/* BOTÕES DE REGISTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/painel/feedback/novo" className="btn-primary w-full py-4">
          <MessageSquarePlus size={20} strokeWidth={1.5} />
          Registrar observação
        </Link>
        <Link href="/painel/feedback/novo?escopo=equipe" className="btn-secondary w-full py-4">
          <Users size={20} strokeWidth={1.5} />
          Registrar para a equipe
        </Link>
      </div>

      {/* OBSERVAÇÕES DE EQUIPE (último mês) */}
      {eq.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold text-text inline-flex items-center gap-2">
              <Users size={20} strokeWidth={1.5} color="#8B6F47" /> Sobre a equipe
            </h2>
            <Link href="/painel/feedbacks-equipe" className="text-sm text-marrom font-medium">Ver todas</Link>
          </div>
          <ul className="space-y-1">
            {eq.slice(0, 3).map((f, i) => (
              <li key={i} className="text-xs text-grafite truncate">
                • {f.texto.length > 60 ? `${f.texto.slice(0, 60)}…` : f.texto}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ÚLTIMAS OBSERVAÇÕES */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-3">Últimas observações</h2>
        {ultimos.length === 0 ? (
          <p className="text-chumbo text-sm">Suas observações vão aparecer aqui.</p>
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
          <h2 className="text-sm font-semibold text-text inline-flex items-center gap-2">
            <Inbox size={18} strokeWidth={1.5} color="#8B6F47" /> Atividade da equipe
          </h2>
          {atividade.length > 0 && (
            <Link href="/painel/atividade" className="text-sm text-marrom font-medium">Ver tudo</Link>
          )}
        </div>
        {atividade.length === 0 ? (
          <p className="text-chumbo text-sm">Nenhuma confirmação de leitura ainda.</p>
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
