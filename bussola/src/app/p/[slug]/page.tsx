import type { Metadata, Viewport } from 'next'
import { Lock } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import Avatar from '@/components/Avatar'
import Timeline, { type ItemElogio } from './Timeline'
import AutoRefresh from './AutoRefresh'
import RegistraSW from './RegistraSW'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#8B6F47',
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: 'Bússola — suas anotações',
    manifest: `/p/${params.slug}/manifest`,
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Bússola' },
  }
}

function TelaInvalida() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-3xl text-preto mb-6">Bússola</h1>
        <Lock size={48} strokeWidth={1.5} color="#8A8A8A" className="mx-auto mb-3" />
        <p className="text-text font-semibold text-lg">Link não disponível</p>
        <p className="text-chumbo text-sm mt-2">
          Este link não está ativo. Se você acha que é um erro, fale com quem te enviou.
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

  // Tenta com logo_url; cai pro select básico se a migration 015 não rodou.
  let estab: { nome: string; logo_url: string | null } | null = null
  const estCompleto = await admin
    .from('estabelecimentos')
    .select('nome, logo_url')
    .eq('id', prof.estabelecimento_id)
    .maybeSingle()
  if (estCompleto.data) {
    estab = {
      nome: estCompleto.data.nome as string,
      logo_url: (estCompleto.data.logo_url as string | null) ?? null,
    }
  } else {
    const estMin = await admin
      .from('estabelecimentos')
      .select('nome')
      .eq('id', prof.estabelecimento_id)
      .maybeSingle()
    if (!estMin.data) return <TelaInvalida />
    estab = { nome: estMin.data.nome as string, logo_url: null }
  }

  const agora = new Date().toISOString()
  const { data: fbData } = await admin
    .from('feedbacks')
    .select('id, texto, categoria, created_at, lido_em, resposta_profissional, resposta_em, visivel_profissional_em')
    .eq('profissional_id', prof.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .not('visivel_profissional_em', 'is', null)
    .lte('visivel_profissional_em', agora)
    .order('created_at', { ascending: false })
  const itens = (fbData ?? []) as ItemElogio[]

  const primeiroNome = prof.nome.split(' ')[0]

  return (
    <div className="min-h-screen bg-background pb-12">
      <RegistraSW />
      <AutoRefresh />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* LOGO DA EMPRESA */}
        {estab.logo_url && (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={estab.logo_url}
              alt={estab.nome}
              loading="eager"
              className="w-16 h-16 rounded-full object-cover bg-linho border border-border"
            />
            <p className="text-sm text-grafite mt-2">{estab.nome}</p>
          </div>
        )}

        {/* IDENTIFICAÇÃO */}
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border-2 border-border p-0.5">
            <Avatar nome={prof.nome} fotoUrl={prof.foto_url} size={64} />
          </span>
          <h1 className="text-xl font-semibold text-preto mt-3">Olá, {primeiroNome}</h1>
          {!estab.logo_url && <p className="text-chumbo text-sm">{estab.nome}</p>}
        </div>

        {/* TIMELINE */}
        <section>
          <h2 className="font-semibold text-text mb-3">Anotações</h2>
          <Timeline itens={itens} slug={params.slug} />
        </section>

        {/* RODAPÉ */}
        <footer className="pt-4 text-center space-y-1">
          <p className="font-serif text-base text-marrom">Bússola</p>
          <p className="text-xs text-chumbo">Salve este link no celular pra acompanhar sempre.</p>
        </footer>
      </main>
    </div>
  )
}
