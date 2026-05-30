import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Zera os campos de leitura/resposta dos feedbacks da empresa do dono logado.
// Útil pra limpar dados de teste sem mexer em texto/categoria.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) return NextResponse.json({ error: 'Sem empresa.' }, { status: 403 })

  const { error } = await supabase
    .from('feedbacks')
    .update({ lido_em: null, resposta_profissional: null, resposta_em: null })
    .eq('estabelecimento_id', est.id)
    .not('lido_em', 'is', null)

  if (error) {
    console.error('[limpar-atividades]', error)
    return NextResponse.json({ error: 'Não foi possível limpar.' }, { status: 500 })
  }

  revalidatePath('/painel')
  revalidatePath('/painel/atividade')
  return NextResponse.json({ ok: true })
}
