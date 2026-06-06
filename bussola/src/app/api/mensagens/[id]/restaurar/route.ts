import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { validarDono } from '../_validar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Desfaz soft delete: deletada=false + deletada_em=null.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const val = await validarDono(params.id)
  if (!val.ok) {
    return NextResponse.json({ error: val.motivo }, { status: val.status })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('mensagens_colaboradores')
    .update({ deletada: false, deletada_em: null })
    .eq('id', val.mensagemId)

  if (error) {
    return NextResponse.json(
      { error: 'falha_ao_restaurar', detail: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
