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

  // Tenta com as colunas novas (migration 010); cai pro select mínimo se
  // ainda não rodou.
  let estabId: string | null = null
  let configIa: { categorizacao_auto?: boolean } | null = null
  let categoriasCustom: string[] | null = null
  const completo = await supabase
    .from('estabelecimentos')
    .select('id, config_ia, categorias_customizadas')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (completo.data) {
    estabId = completo.data.id as string
    configIa = (completo.data.config_ia as { categorizacao_auto?: boolean } | null) ?? null
    categoriasCustom = Array.isArray(completo.data.categorias_customizadas)
      ? (completo.data.categorias_customizadas as string[])
      : null
  } else {
    const minimo = await supabase
      .from('estabelecimentos')
      .select('id, config_ia')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!minimo.data) redirect('/onboarding')
    estabId = minimo.data.id as string
    configIa = (minimo.data.config_ia as { categorizacao_auto?: boolean } | null) ?? null
  }

  const categorizacaoAuto = configIa?.categorizacao_auto !== false
  const categorias = categoriasCustom && categoriasCustom.length > 0 ? categoriasCustom : CATEGORIAS

  const { data } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', estabId)
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
