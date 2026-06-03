import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Marca que o cliente clicou em "Avaliar no Google" pra um feedback.
// Público (sem auth) — chamado pelo client da tela /c/[slug] logo antes
// de abrir a URL do Google em nova aba. Sem efeito se a migration 019
// não rodou (update ignora colunas inexistentes? não — supabase falha,
// então tratamos silenciosamente).
export async function POST(req: Request) {
  try {
    const { feedback_id } = await req.json().catch(() => ({}))
    if (!feedback_id || typeof feedback_id !== 'string') {
      return NextResponse.json({ error: 'feedback_id obrigatório.' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { error } = await admin
      .from('feedbacks_cliente')
      .update({ clicou_google: true })
      .eq('id', feedback_id)
    if (error) {
      // Migration 019 ainda não rodou — tudo bem, não bloqueia o fluxo.
      console.warn('[clicou-google] update falhou (provavelmente sem coluna)', error.message)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[clicou-google]', err)
    return NextResponse.json({ ok: true })
  }
}
