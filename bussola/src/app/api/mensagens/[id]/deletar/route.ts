import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { validarDono } from '../_validar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Soft delete: marca deletada=true + deletada_em=now(). Não apaga o
// registro. Restauração possível em /api/mensagens/[id]/restaurar.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const val = await validarDono(params.id)
  if (!val.ok) {
    return NextResponse.json({ error: val.motivo }, { status: val.status })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('mensagens_colaboradores')
    .update({ deletada: true, deletada_em: new Date().toISOString() })
    .eq('id', val.mensagemId)

  if (error) {
    return NextResponse.json(
      { error: 'falha_ao_deletar', detail: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
