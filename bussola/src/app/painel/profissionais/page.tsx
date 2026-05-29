import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Profissional } from '@/lib/profissionais'
import ListaClient from './ListaClient'

export default async function ProfissionaisPage() {
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
    .select('*')
    .eq('estabelecimento_id', estabelecimento.id)
    .order('created_at', { ascending: true })

  const profissionais = (data ?? []) as Profissional[]

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-semibold text-text">Colaboradores</h1>
        {profissionais.length > 0 && (
          <Link href="/painel/profissionais/novo" className="btn-primary px-4 py-2.5 text-sm">
            + Cadastrar colaborador
          </Link>
        )}
      </div>

      <ListaClient profissionais={profissionais} />
    </main>
  )
}
