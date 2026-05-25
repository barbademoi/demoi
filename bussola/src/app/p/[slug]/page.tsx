import type { Metadata, Viewport } from 'next'
import { createAdminClient } from '@/utils/supabase/admin'
import Avatar from '@/components/Avatar'
import { calcularPlacar, type Feedback } from '@/lib/feedbacks'
import { intervalo, intervaloAnterior } from '@/lib/periodos'
import { evolucaoSemanal } from '@/lib/evolucao'
import { calcularBadges } from '@/lib/badges'
import { spNowParts } from '@/lib/tz'
import GraficoEvolucao from './GraficoEvolucao'
import Elogios, { type Elogio } from './Elogios'
import Conquistas from './Conquistas'
import AtualizacaoAuto from './AtualizacaoAuto'
import RegistraSW from './RegistraSW'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#1F3A52',
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: 'Bússola — seu placar',
    manifest: `/p/${params.slug}/manifest`,
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Bússola' },
  }
}

function placarDe(fbs: { tipo: Feedback['tipo']; estrelas: number | null }[]) {
  return calcularPlacar(fbs)
}

function TelaInvalida() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-primary mb-6">Bússola</h1>
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-text font-semibold text-lg">Link não disponível</p>
        <p className="text-text-muted text-sm mt-2">
          Este link não está mais ativo. Se você acha que isso é um erro, fale com o responsável
          pela barbearia.
        </p>
      </div>
    </main>
  )
}

export default async function PlacarPublicoPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient()

  const { data: prof } = await admin
    .from('profissionais')
    .select('id, nome, foto_url, data_entrada, status, estabelecimento_id')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!prof || prof.status === 'desligado') return <TelaInvalida />

  const { data: estab } = await admin
    .from('estabelecimentos')
    .select('nome')
    .eq('id', prof.estabelecimento_id)
    .maybeSingle()
  if (!estab) return <TelaInvalida />

  // Feedbacks do profissional (para placar, evolução, elogios e badges).
  const { data: fbData } = await admin
    .from('feedbacks')
    .select('id, tipo, estrelas, texto, categoria, created_at')
    .eq('profissional_id', prof.id)
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
  const feedbacks = (fbData ?? []) as Feedback[]

  const noIntervalo = (iv: { inicio: Date; fim: Date }) =>
    feedbacks.filter((f) => {
      const t = new Date(f.created_at).getTime()
      return t >= iv.inicio.getTime() && t <= iv.fim.getTime()
    })

  const placarSemana = placarDe(noIntervalo(intervalo('semana')))
  const placarSemanaAnt = placarDe(noIntervalo(intervaloAnterior('semana')))
  const deltaSemana = placarSemana - placarSemanaAnt
  const placarMes = placarDe(noIntervalo(intervalo('mes')))

  const positivos = feedbacks.filter((f) => f.tipo === 'positivo')
  const elogiosSemana = noIntervalo(intervalo('semana')).filter((f) => f.tipo === 'positivo').length
  const elogios: Elogio[] = positivos.map((f) => ({
    id: f.id,
    texto: f.texto,
    estrelas: f.estrelas,
    categoria: f.categoria,
    created_at: f.created_at,
  }))

  const evolucao = evolucaoSemanal(feedbacks, 12)
  const evolucaoGrafico = evolucao.slice(-8).map((p) => ({ label: p.label, valor: p.valor, atual: p.atual }))

  // Ranking interno (para as badges mestre_semana e top3_mes).
  const mes = intervalo('mes')
  const semana = intervalo('semana')
  const [{ data: ativosData }, { data: estabFbData }] = await Promise.all([
    admin.from('profissionais').select('id').eq('estabelecimento_id', prof.estabelecimento_id).eq('status', 'ativo'),
    admin
      .from('feedbacks')
      .select('profissional_id, tipo, estrelas, created_at')
      .eq('estabelecimento_id', prof.estabelecimento_id)
      .is('deletado_em', null)
      .gte('created_at', mes.inicio.toISOString())
      .lte('created_at', mes.fim.toISOString()),
  ])

  const ativos = (ativosData ?? []).map((a) => a.id as string)
  const estabFb = (estabFbData ?? []) as { profissional_id: string; tipo: Feedback['tipo']; estrelas: number | null; created_at: string }[]

  const placarMesProf: Record<string, number> = {}
  const placarSemProf: Record<string, number> = {}
  for (const id of ativos) {
    const doProf = estabFb.filter((f) => f.profissional_id === id)
    placarMesProf[id] = placarDe(doProf)
    placarSemProf[id] = placarDe(
      doProf.filter((f) => {
        const t = new Date(f.created_at).getTime()
        return t >= semana.inicio.getTime() && t <= semana.fim.getTime()
      })
    )
  }

  const maxSemana = Math.max(0, ...ativos.map((id) => placarSemProf[id] ?? 0))
  const mestreSemana = (placarSemProf[prof.id] ?? 0) > 0 && (placarSemProf[prof.id] ?? 0) === maxSemana

  const top3Ids = [...ativos]
    .sort((a, b) => (placarMesProf[b] ?? 0) - (placarMesProf[a] ?? 0))
    .filter((id) => (placarMesProf[id] ?? 0) > 0)
    .slice(0, 3)
  const top3Mes = top3Ids.includes(prof.id)

  const badges = calcularBadges({
    feedbacks,
    evolucao,
    dataEntrada: prof.data_entrada,
    mestreSemana,
    top3Mes,
  })

  const primeiroNome = prof.nome.split(' ')[0]
  const now = spNowParts()
  const horaAtualizacao = `${String(now.h).padStart(2, '0')}:${String(now.min).padStart(2, '0')}`

  const compTexto =
    deltaSemana > 0
      ? `+${deltaSemana} em relação à semana passada`
      : deltaSemana < 0
        ? `${deltaSemana} em relação à semana passada`
        : 'Igual à semana passada'
  const compCor = deltaSemana > 0 ? 'text-green-600' : deltaSemana < 0 ? 'text-red-600' : 'text-text-muted'

  return (
    <div className="min-h-screen bg-background pb-10">
      <RegistraSW />
      <AtualizacaoAuto elogiosTotal={positivos.length} />

      <main className="max-w-md mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* IDENTIFICAÇÃO */}
        <div className="flex items-center gap-3">
          <Avatar nome={prof.nome} fotoUrl={prof.foto_url} size={56} />
          <div className="min-w-0">
            <p className="text-xl font-bold text-text leading-tight">Olá, {primeiroNome}!</p>
            <p className="text-text-muted text-sm truncate">{estab.nome}</p>
          </div>
        </div>

        {/* PLACAR DA SEMANA */}
        <div className="card p-6 text-center">
          <p className="text-text-muted text-sm font-medium">Sua semana</p>
          <p className={`text-6xl font-extrabold my-2 ${placarSemana >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {placarSemana > 0 ? `+${placarSemana}` : placarSemana}
          </p>
          <p className={`text-sm font-medium ${compCor}`}>{compTexto}</p>
          <p className="text-text-muted text-sm mt-2">
            {elogiosSemana === 0
              ? 'Nenhum elogio ainda esta semana'
              : `${elogiosSemana} elogio${elogiosSemana > 1 ? 's' : ''} esta semana`}
          </p>
        </div>

        {/* PLACAR DO MÊS */}
        <div className="card p-5 text-center">
          <p className="text-text-muted text-sm font-medium">Seu mês</p>
          <p className={`text-4xl font-bold mt-1 ${placarMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {placarMes > 0 ? `+${placarMes}` : placarMes}
          </p>
        </div>

        {/* EVOLUÇÃO */}
        <div className="card p-5">
          <h2 className="font-semibold text-text mb-3">Sua evolução</h2>
          <GraficoEvolucao pontos={evolucaoGrafico} />
        </div>

        {/* ELOGIOS */}
        <section>
          <h2 className="font-semibold text-text">Elogios que você recebeu</h2>
          <p className="text-text-muted text-xs mb-3">
            Estes são os feedbacks positivos do dono sobre seu trabalho.
          </p>
          <Elogios elogios={elogios} />
        </section>

        {/* CONQUISTAS */}
        <section>
          <h2 className="font-semibold text-text mb-3">Suas conquistas</h2>
          <Conquistas conquistadas={Array.from(badges)} />
        </section>

        {/* RODAPÉ */}
        <footer className="pt-4 text-center space-y-2">
          <p className="text-xs text-text-muted">Última atualização: {horaAtualizacao}</p>
          <p className="text-xs text-text-muted/80">
            Quer salvar este link no celular? Toque no menu do navegador → Adicionar à tela inicial.
          </p>
          <p className="text-xs font-semibold text-primary/70">Bússola</p>
        </footer>
      </main>
    </div>
  )
}
