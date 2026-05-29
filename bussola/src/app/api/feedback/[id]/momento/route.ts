import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { Momento } from '@/lib/iaPrompts'

const VALIDOS: Momento[] = ['reconhecimento', 'ajuste', 'equipe', 'neutro']

// Atualiza manualmente o momento_reuniao de uma observação.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { momento } = await req.json().catch(() => ({}))
  if (!VALIDOS.includes(momento)) {
    return NextResponse.json({ error: 'momento inválido.' }, { status: 400 })
  }

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
    .update({ momento_reuniao: momento })
    .eq('id', params.id)
    .eq('estabelecimento_id', est.id)
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
