import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FeedbackForm from '../FeedbackForm'

export const dynamic = 'force-dynamic'

export default async function NovoFeedbackPage({ searchParams }: { searchParams: { escopo?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

  const { data } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  const profissionais = data ?? []

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-1">Registrar feedback</h1>
      {profissionais.length === 0 && (
        <p className="text-text-muted text-sm mb-4">
          Você ainda não tem profissionais ativos.{' '}
          <Link href="/painel/profissionais/novo" className="text-primary underline">
            Cadastrar um
          </Link>
          .
        </p>
      )}
      <FeedbackForm
        profissionais={profissionais}
        modo="novo"
        escopoInicial={searchParams.escopo === 'equipe' ? 'equipe' : 'individual'}
      />
    </main>
  )
}
