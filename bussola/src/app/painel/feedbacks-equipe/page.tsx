import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Feedback, FeedbackComProfissional } from '@/lib/feedbacks'
import FeedbacksList from '../profissionais/[id]/FeedbacksList'

export const dynamic = 'force-dynamic'

export default async function FeedbacksEquipePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const { data } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('escopo', 'equipe')
    .is('deletado_em', null)
    .order('created_at', { ascending: false })

  const lista: FeedbackComProfissional[] = ((data ?? []) as Feedback[]).map((f) => ({ ...f, profissionais: null }))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-4">Feedbacks de equipe</h1>
      <FeedbacksList feedbacks={lista} nome="a equipe" />
    </main>
  )
}
