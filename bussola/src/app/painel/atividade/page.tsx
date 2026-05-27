import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AtividadeClient, { type ItemAtividade } from './AtividadeClient'

export const dynamic = 'force-dynamic'

export default async function AtividadePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase.from('estabelecimentos').select('id').eq('dono_id', user.id).maybeSingle()
  if (!est) redirect('/onboarding')

  const { data } = await supabase
    .from('feedbacks')
    .select('id, profissional_id, tipo, texto, lido_em, resposta_profissional, resposta_em, profissionais(nome, foto_url)')
    .eq('estabelecimento_id', est.id)
    .not('lido_em', 'is', null)
    .order('lido_em', { ascending: false })
    .limit(200)
  const itens = ((data ?? []) as unknown as ItemAtividade[]).sort((a, b) => {
    const ta = Math.max(Date.parse(a.resposta_em ?? a.lido_em ?? '0') || 0, Date.parse(a.lido_em ?? '0') || 0)
    const tb = Math.max(Date.parse(b.resposta_em ?? b.lido_em ?? '0') || 0, Date.parse(b.lido_em ?? '0') || 0)
    return tb - ta
  })

  const { data: ativosData } = await supabase
    .from('profissionais')
    .select('id, nome')
    .eq('estabelecimento_id', est.id)
    .order('nome')

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-4">📬 Atividade da equipe</h1>
      <AtividadeClient itens={itens} ativos={(ativosData ?? []) as { id: string; nome: string }[]} />
    </main>
  )
}
