import type { Metadata, Viewport } from 'next'
import { Lock } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import FeedbackClienteCliente, { type ColaboradorLite } from './FeedbackClienteCliente'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#8B6F47',
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: 'Bússola — Avaliar atendimento',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Bússola' },
  }
}

function LinkInvalido() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-3xl text-preto mb-6">Bússola</h1>
        <Lock size={48} strokeWidth={1.5} color="#8A8A8A" className="mx-auto mb-3" />
        <p className="text-text font-semibold text-lg">Link não disponível</p>
        <p className="text-chumbo text-sm mt-2">
          Este link não está ativo. Se você acha que é um erro, fale com a empresa.
        </p>
      </div>
    </main>
  )
}

export default async function FeedbackClientePage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient()

  // Tenta com logo_url; cai pro select básico se a migration 015 não rodou.
  let est: { id: string; nome: string; feedback_cliente_ativo: boolean; mensagem_pos_feedback: string | null; logo_url: string | null } | null = null
  const completo = await admin
    .from('estabelecimentos')
    .select('id, nome, feedback_cliente_ativo, mensagem_pos_feedback, logo_url')
    .eq('link_feedback_cliente_slug', params.slug)
    .maybeSingle()
  if (completo.data) {
    est = {
      id: completo.data.id as string,
      nome: completo.data.nome as string,
      feedback_cliente_ativo: !!completo.data.feedback_cliente_ativo,
      mensagem_pos_feedback: (completo.data.mensagem_pos_feedback as string | null) ?? null,
      logo_url: (completo.data.logo_url as string | null) ?? null,
    }
  } else {
    const minimo = await admin
      .from('estabelecimentos')
      .select('id, nome, feedback_cliente_ativo, mensagem_pos_feedback')
      .eq('link_feedback_cliente_slug', params.slug)
      .maybeSingle()
    if (!minimo.data) return <LinkInvalido />
    est = {
      id: minimo.data.id as string,
      nome: minimo.data.nome as string,
      feedback_cliente_ativo: !!minimo.data.feedback_cliente_ativo,
      mensagem_pos_feedback: (minimo.data.mensagem_pos_feedback as string | null) ?? null,
      logo_url: null,
    }
  }
  if (!est.feedback_cliente_ativo) return <LinkInvalido />

  const { data: ativos } = await admin
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  const colaboradores = (ativos ?? []) as ColaboradorLite[]

  // Quantos brindes ativos a empresa tem? Usado pra exibir o aviso de
  // sorteio em cima do campo de comentário.
  const { count: brindesAtivos } = await admin
    .from('brindes')
    .select('id', { count: 'exact', head: true })
    .eq('estabelecimento_id', est.id)
    .eq('ativo', true)

  return (
    <FeedbackClienteCliente
      slug={params.slug}
      nomeEmpresa={est.nome}
      logoUrl={est.logo_url}
      colaboradores={colaboradores}
      mensagemPosFeedback={est.mensagem_pos_feedback ?? ''}
      temBrindes={(brindesAtivos ?? 0) > 0}
    />
  )
}
