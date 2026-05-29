import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CATEGORIAS } from '@/lib/feedbacks'
import FeedbackForm from '../FeedbackForm'

export const dynamic = 'force-dynamic'

export default async function NovoFeedbackPage({ searchParams }: { searchParams: { escopo?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id, config_ia, categorias_customizadas')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

  const categorizacaoAuto = (estabelecimento.config_ia as { categorizacao_auto?: boolean } | null)?.categorizacao_auto !== false
  const categorias =
    Array.isArray(estabelecimento.categorias_customizadas) && estabelecimento.categorias_customizadas.length > 0
      ? (estabelecimento.categorias_customizadas as string[])
      : CATEGORIAS

  const { data } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  const profissionais = data ?? []

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-text mb-1">Registrar observação</h1>
      {profissionais.length === 0 && (
        <p className="text-chumbo text-sm mb-4">
          Você ainda não tem colaboradores ativos.{' '}
          <Link href="/painel/profissionais/novo" className="text-marrom underline">
            Cadastrar um
          </Link>
          .
        </p>
      )}
      <FeedbackForm
        profissionais={profissionais}
        categorias={categorias}
        modo="novo"
        escopoInicial={searchParams.escopo === 'equipe' ? 'equipe' : 'individual'}
        categorizacaoAuto={categorizacaoAuto}
      />
    </main>
  )
}
