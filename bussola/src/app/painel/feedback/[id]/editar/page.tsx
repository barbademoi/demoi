import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Feedback } from '@/lib/feedbacks'
import FeedbackForm from '../../FeedbackForm'

export const dynamic = 'force-dynamic'

export default async function EditarFeedbackPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

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
      <h1 className="text-xl font-bold text-text mb-4">Editar feedback</h1>
      <FeedbackForm
        profissionais={profsData ?? []}
        modo="editar"
        inicial={{
          id: fb.id,
          profissional_id: fb.profissional_id,
          tipo: fb.tipo,
          texto: fb.texto,
          estrelas: fb.estrelas,
          categoria: fb.categoria,
        }}
      />
    </main>
  )
}
