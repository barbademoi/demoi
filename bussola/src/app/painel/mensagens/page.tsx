import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { MensagensClient, type ItemMensagem } from './MensagensClient'

export const dynamic = 'force-dynamic'

export default async function MensagensPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  // RLS já garante que só vê do próprio estabelecimento; o filtro abaixo é
  // defensivo e ajuda o planner. Tenta selecionar deletada/deletada_em
  // (migration 023); cai pra select sem essas colunas se ainda não rodou.
  let itens: ItemMensagem[] = []
  const completo = await supabase
    .from('mensagens_colaboradores')
    .select('id, colaborador_id, conteudo, anonimo, lida, deletada, deletada_em, created_at, profissionais(nome)')
    .eq('estabelecimento_id', est.id)
    .order('created_at', { ascending: false })
    .limit(500)
  if (completo.data) {
    itens = completo.data as unknown as ItemMensagem[]
  } else {
    const minimo = await supabase
      .from('mensagens_colaboradores')
      .select('id, colaborador_id, conteudo, anonimo, lida, created_at, profissionais(nome)')
      .eq('estabelecimento_id', est.id)
      .order('created_at', { ascending: false })
      .limit(500)
    itens = ((minimo.data ?? []) as unknown as ItemMensagem[]).map((m) => ({
      ...m,
      deletada: false,
      deletada_em: null,
    }))
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-text mb-4 inline-flex items-center gap-2">
        <Mail size={22} strokeWidth={1.5} color="#8B6F47" /> Mensagens dos colaboradores
      </h1>
      <MensagensClient itens={itens} />
    </main>
  )
}
