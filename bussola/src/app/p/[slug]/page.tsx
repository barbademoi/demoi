import type { Metadata, Viewport } from 'next'
import { Lock } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import Avatar from '@/components/Avatar'
import BotaoInstalarPWA from '@/components/BotaoInstalarPWA'
import Timeline, { type ItemElogio } from './Timeline'
import FeedbacksCliente, { type ItemFeedbackCliente } from './FeedbacksCliente'
import AutoRefresh from './AutoRefresh'
import RegistraSW from './RegistraSW'
import { CaixaMensagem } from './CaixaMensagem'

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

  // Tenta com logo_url/dono_id; cai pro select básico se a migration 015 não rodou.
  let estab: { nome: string; logo_url: string | null; dono_id: string | null } | null = null
  const estCompleto = await admin
    .from('estabelecimentos')
    .select('nome, logo_url, dono_id')
    .eq('id', prof.estabelecimento_id)
    .maybeSingle()
  if (estCompleto.data) {
    estab = {
      nome: estCompleto.data.nome as string,
      logo_url: (estCompleto.data.logo_url as string | null) ?? null,
      dono_id: (estCompleto.data.dono_id as string | null) ?? null,
    }
  } else {
    const estMin = await admin
      .from('estabelecimentos')
      .select('nome, dono_id')
      .eq('id', prof.estabelecimento_id)
      .maybeSingle()
    if (!estMin.data) return <TelaInvalida />
    estab = {
      nome: estMin.data.nome as string,
      logo_url: null,
      dono_id: (estMin.data.dono_id as string | null) ?? null,
    }
  }

  // Nome do gestor (best-effort via auth admin). Fallback: nome da empresa.
  let nomeGestor: string | null = null
  if (estab.dono_id) {
    try {
      const { data: userResp } = await admin.auth.admin.getUserById(estab.dono_id)
      const meta = (userResp?.user?.user_metadata ?? {}) as Record<string, unknown>
      const candidato = (meta.nome ?? meta.full_name ?? meta.name) as unknown
      if (typeof candidato === 'string' && candidato.trim()) {
        nomeGestor = candidato.trim().split(/\s+/)[0]
      }
    } catch {
      /* segue com fallback */
    }
  }
  const tituloAnotacoes = nomeGestor ? `Anotações do ${nomeGestor}` : `Anotações da ${estab.nome}`

  const agora = new Date().toISOString()

  // Todos os feedbacks visíveis do profissional.
  const { data: fbData } = await admin
    .from('feedbacks')
    .select('id, texto, categoria, created_at, lido_em, resposta_profissional, resposta_em, visivel_profissional_em')
    .eq('profissional_id', prof.id)
    .eq('escopo', 'individual')
    .is('deletado_em', null)
    .not('visivel_profissional_em', 'is', null)
    .lte('visivel_profissional_em', agora)
    .order('created_at', { ascending: false })
  const todos = (fbData ?? []) as ItemElogio[]

  // Feedbacks de cliente compartilhados com este colaborador.
  // Cada um aponta pra uma observação gerada (feedback_gerado_id) — usamos esse
  // id pra remover a observação correspondente da lista do gestor.
  let feedbacksCliente: ItemFeedbackCliente[] = []
  let idsGerados = new Set<string>()
  try {
    const { data: fcData } = await admin
      .from('feedbacks_cliente')
      .select('id, nome_cliente, identificado, estrelas, comentario, created_at, feedback_gerado_id')
      .eq('profissional_id', prof.id)
      .eq('status', 'compartilhado_colaborador')
      .not('feedback_gerado_id', 'is', null)
      .order('created_at', { ascending: false })
    if (fcData) {
      idsGerados = new Set(fcData.map((f) => f.feedback_gerado_id as string).filter(Boolean))
      feedbacksCliente = fcData.map((f) => ({
        id: f.id as string,
        nome_cliente: (f.nome_cliente as string | null) ?? null,
        identificado: !!f.identificado,
        estrelas: f.estrelas as number,
        comentario: (f.comentario as string | null) ?? null,
        created_at: f.created_at as string,
      }))
    }
  } catch {
    /* Migration 012 ausente — sem feedbacks de cliente. */
  }

  const anotacoes = todos.filter((f) => !idsGerados.has(f.id))

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

        {/* SEÇÃO 1 — ANOTAÇÕES DO GESTOR */}
        <section>
          <h2 className="font-semibold text-text mb-3">{tituloAnotacoes}</h2>
          <Timeline itens={anotacoes} slug={params.slug} />
        </section>

        {/* SEÇÃO 2 — FEEDBACKS DE CLIENTES */}
        {feedbacksCliente.length > 0 && (
          <section className="pt-4 border-t border-border">
            <h2 className="font-semibold text-text mb-3 mt-4">O que os clientes disseram</h2>
            <FeedbacksCliente itens={feedbacksCliente} />
          </section>
        )}

        {/* CAIXA DE MENSAGEM PRO DONO */}
        <CaixaMensagem slug={params.slug} />

        {/* INSTALAR PWA */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-chumbo">Quer acessar rapidinho? Salva como atalho:</p>
          <BotaoInstalarPWA />
        </div>

        {/* RODAPÉ */}
        <footer className="pt-4 text-center space-y-2">
          <a
            href="https://bussolameet.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-simbolo-transparente.svg" alt="" width={16} height={16} />
            <span className="text-xs text-chumbo">Powered by Bússola</span>
          </a>
          <p className="text-xs text-chumbo">Salve este link no celular pra acompanhar sempre.</p>
        </footer>
      </main>
    </div>
  )
}
