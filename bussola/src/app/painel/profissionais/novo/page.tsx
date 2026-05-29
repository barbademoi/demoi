import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfissionalForm from '../ProfissionalForm'

export default async function NovoProfissionalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!estabelecimento) redirect('/onboarding')

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-text mb-5">Cadastrar colaborador</h1>
      <ProfissionalForm estabelecimentoId={estabelecimento.id} modo="novo" />
    </main>
  )
}
