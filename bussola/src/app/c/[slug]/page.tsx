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

  const { data: est } = await admin
    .from('estabelecimentos')
    .select('id, nome, feedback_cliente_ativo, mensagem_pos_feedback')
    .eq('link_feedback_cliente_slug', params.slug)
    .maybeSingle()
  if (!est || !est.feedback_cliente_ativo) return <LinkInvalido />

  const { data: ativos } = await admin
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  const colaboradores = (ativos ?? []) as ColaboradorLite[]

  return (
    <FeedbackClienteCliente
      slug={params.slug}
      nomeEmpresa={est.nome as string}
      colaboradores={colaboradores}
      mensagemPosFeedback={(est.mensagem_pos_feedback as string | null) ?? ''}
    />
  )
}
