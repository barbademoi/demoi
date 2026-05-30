import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// DELETE /api/feedback-cliente/[id]
// Exclusão definitiva (hard delete). Valida que o feedback pertence à
// empresa do dono autenticado. Se o feedback já gerou uma observação
// interna (feedback_gerado_id preenchido), essa observação NÃO é apagada
// — só o feedback de cliente original some.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) return NextResponse.json({ error: 'Sem empresa.' }, { status: 403 })

  const { error, count } = await supabase
    .from('feedbacks_cliente')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('estabelecimento_id', est.id)

  if (error) {
    console.error('[delete feedback-cliente]', error)
    return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 500 })
  }
  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Feedback não encontrado.' }, { status: 403 })
  }

  revalidatePath('/painel/feedbacks-cliente')
  revalidatePath('/painel')
  return NextResponse.json({ ok: true })
}
