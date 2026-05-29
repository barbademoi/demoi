import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Profissional } from '@/lib/profissionais'
import ProfissionalForm from '../../ProfissionalForm'

export default async function EditarProfissionalPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data } = await supabase
    .from('profissionais')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()
  const profissional = data as Profissional

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-text mb-5">Editar colaborador</h1>
      <ProfissionalForm
        estabelecimentoId={profissional.estabelecimento_id}
        modo="editar"
        inicial={profissional}
      />
    </main>
  )
}
