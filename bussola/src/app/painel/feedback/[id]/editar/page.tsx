import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CATEGORIAS, type Feedback } from '@/lib/feedbacks'
import FeedbackForm from '../../FeedbackForm'

export const dynamic = 'force-dynamic'

export default async function EditarFeedbackPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id, categorias_customizadas')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

  const categorias =
    Array.isArray(estabelecimento.categorias_customizadas) && estabelecimento.categorias_customizadas.length > 0
      ? (estabelecimento.categorias_customizadas as string[])
      : CATEGORIAS

  const { data: fbData } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('id', params.id)
    .is('deletado_em', null)
    .maybeSingle()
  if (!fbData) notFound()
  const fb = fbData as Feedback

  const { data: profsData } = await supabase
    .from('profissionais')
    .select('id, nome, foto_url')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-text mb-4">Editar observação</h1>
      <FeedbackForm
        profissionais={profsData ?? []}
        categorias={categorias}
        modo="editar"
        inicial={{
          id: fb.id,
          escopo: fb.escopo,
          profissional_id: fb.profissional_id,
          texto: fb.texto,
          categoria: fb.categoria,
        }}
      />
    </main>
  )
}
