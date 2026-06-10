import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import FeedbackConfigClient from './FeedbackConfigClient'
import type { Brinde } from '@/types/database'

export const dynamic = 'force-dynamic'

interface BarbeariaFC {
  id: string
  nome: string
  feedback_ativo: boolean
  feedback_slug: string | null
  feedback_mensagem_pos: string | null
  feedback_google_review_url: string | null
  feedback_nota_minima_positivo: number
  feedback_gamificacao_ativa: boolean
  feedback_pontos_por_feedback: number
  feedback_limite_diario_pontuavel: number
  feedback_brinde_minimo_id: string | null
}

export default async function FeedbackClientePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id, barbearias(id, nome, feedback_ativo, feedback_slug, feedback_mensagem_pos, feedback_google_review_url, feedback_nota_minima_positivo, feedback_gamificacao_ativa, feedback_pontos_por_feedback, feedback_limite_diario_pontuavel, feedback_brinde_minimo_id)')
    .eq('id', user.id).single() as { data: { barbearia_id: string; barbearias: BarbeariaFC } | null }

  if (!usuario?.barbearias) redirect('/login')
  const barb = usuario.barbearias

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brindesRaw } = await (supabase as any)
    .from('brindes').select('*').eq('barbearia_id', barb.id).order('created_at', { ascending: false })
  const brindes = (brindesRaw ?? []) as Brinde[]

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barb.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <header>
            <h1 className="font-serif text-2xl sm:text-3xl text-text">Feedback de Cliente</h1>
            <p className="text-text-muted text-sm font-sans mt-1">
              Colete avaliações de clientes em um link público, sorteie brindes e direcione 4★+ para o Google.
            </p>
          </header>

          <FeedbackConfigClient barbearia={barb} brindes={brindes} />
        </main>
      </div>
    </div>
  )
}
