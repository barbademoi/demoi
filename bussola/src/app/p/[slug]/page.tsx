import type { Metadata, Viewport } from 'next'
import { createAdminClient } from '@/utils/supabase/admin'
import Avatar from '@/components/Avatar'
import { intervalo } from '@/lib/periodos'
import Timeline, { type ItemElogio } from './Timeline'
import AutoRefresh from './AutoRefresh'
import RegistraSW from './RegistraSW'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#1F3A52',
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: 'Bússola — seus elogios',
    manifest: `/p/${params.slug}/manifest`,
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Bússola' },
  }
}

function fraseSemana(n: number): string {
  if (n === 0) return 'Comece a semana com tudo. Cada bom atendimento será notado.'
  if (n === 1) return 'Você foi elogiado uma vez esta semana. Continue assim.'
  if (n <= 3) return `Você foi elogiado ${n} vezes esta semana. Boa semana!`
  if (n <= 5) return `Você foi elogiado ${n} vezes esta semana. Está sendo um exemplo.`
  return `Você foi elogiado ${n} vezes esta semana. Semana excepcional!`
}

function TelaInvalida() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-primary mb-6">Bússola</h1>
        <div className="text-5xl mb-3">🔒</div>
        <p className="text-text font-semibold text-lg">Link não disponível</p>
        <p className="text-text-muted text-sm mt-2">
          Este link não está ativo. Se você acha que é um erro, fale com o responsável pelo
          estabelecimento.
        </p>
      </div>
    </main>
  )
}

export default async function TimelinePublicaPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient()

  const { data: prof } = await admin
    .from('profissionais')
    .select('id, nome, foto_url, status, estabelecimento_id')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!prof || prof.status === 'desligado') return <TelaInvalida />

  const { data: estab } = await admin
    .from('estabelecimentos')
    .select('nome')
    .eq('id', prof.estabelecimento_id)
    .maybeSingle()
  if (!estab) return <TelaInvalida />

  // Elogios e pontos a desenvolver (individuais) deste profissional.
  const { data: fbData } = await admin
    .from('feedbacks')
    .select('id, tipo, texto, categoria, created_at')
    .eq('profissional_id', prof.id)
    .eq('escopo', 'individual')
    .in('tipo', ['positivo', 'negativo'])
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
  const itens = (fbData ?? []) as ItemElogio[]

  const semana = intervalo('semana')
  const mes = intervalo('mes')
  const dentro = (iso: string, iv: { inicio: Date; fim: Date }) => {
    const t = new Date(iso).getTime()
    return t >= iv.inicio.getTime() && t <= iv.fim.getTime()
  }

  const positivos = itens.filter((e) => e.tipo === 'positivo')
  const elogiosSemana = positivos.filter((e) => dentro(e.created_at, semana)).length

  // Categoria mais elogiada no mês (empate → mais recente).
  const elogiosMes = positivos.filter((e) => dentro(e.created_at, mes))
  const contagem: Record<string, { n: number; idx: number }> = {}
  elogiosMes.forEach((e, i) => {
    if (!e.categoria) return
    if (!contagem[e.categoria]) contagem[e.categoria] = { n: 0, idx: i }
    contagem[e.categoria].n += 1
  })
  const ranked = Object.entries(contagem).sort((a, b) => b[1].n - a[1].n || a[1].idx - b[1].idx)
  const categoriaTop = ranked.length ? ranked[0][0] : null

  const primeiroNome = prof.nome.split(' ')[0]

  return (
    <div className="min-h-screen bg-background pb-12">
      <RegistraSW />
      <AutoRefresh />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* IDENTIFICAÇÃO */}
        <div className="flex flex-col items-center text-center">
          <Avatar nome={prof.nome} fotoUrl={prof.foto_url} size={88} />
          <h1 className="text-2xl font-bold text-text mt-3">Olá, {primeiroNome}</h1>
          <p className="text-text-muted text-sm">{estab.nome}</p>
        </div>

        {/* FRASE DA SEMANA */}
        <p className="text-center text-text text-[17px] leading-relaxed px-2">
          {fraseSemana(elogiosSemana)}
        </p>

        {/* RESUMO MENSAL */}
        {categoriaTop && (
          <p className="text-center text-sm text-text-muted">
            Sua categoria mais elogiada este mês: <span className="text-text font-medium">{categoriaTop}</span>
          </p>
        )}

        {/* TIMELINE */}
        <section>
          <h2 className="font-semibold text-text mb-3">Seus feedbacks</h2>
          <Timeline itens={itens} />
        </section>

        {/* RODAPÉ */}
        <footer className="pt-4 text-center space-y-1">
          <p className="text-xs font-semibold text-primary/70">Bússola</p>
          <p className="text-xs text-text-muted/80">Salve este link no celular pra acompanhar sempre.</p>
        </footer>
      </main>
    </div>
  )
}
