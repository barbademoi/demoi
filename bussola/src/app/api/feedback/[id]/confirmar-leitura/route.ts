import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Rota pública (sem login do profissional). Valida que o slug bate com o
// profissional dono do feedback antes de marcar leitura/resposta.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { slug, resposta_opcional } = await req.json().catch(() => ({}))
  if (!slug) return NextResponse.json({ error: 'slug obrigatório.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: fb } = await admin
    .from('feedbacks')
    .select('id, escopo, lido_em, visivel_profissional_em, profissionais(slug, status)')
    .eq('id', params.id)
    .is('deletado_em', null)
    .maybeSingle()

  if (!fb) return NextResponse.json({ error: 'Feedback não encontrado.' }, { status: 404 })

  const prof = (fb as unknown as { profissionais: { slug: string; status: string } | null }).profissionais
  if (fb.escopo !== 'individual' || !prof) {
    return NextResponse.json({ error: 'Não permitido.' }, { status: 400 })
  }
  if (prof.slug !== slug || prof.status === 'desligado') {
    return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })
  }
  // Só permite confirmar o que já está visível pro profissional (respeita a carência).
  if (!fb.visivel_profissional_em || new Date(fb.visivel_profissional_em).getTime() > Date.now()) {
    return NextResponse.json({ error: 'Ainda não disponível.' }, { status: 403 })
  }

  const update: Record<string, string> = { lido_em: fb.lido_em ?? new Date().toISOString() }
  if (typeof resposta_opcional === 'string' && resposta_opcional.trim()) {
    update.resposta_profissional = resposta_opcional.trim().slice(0, 1000)
    update.resposta_em = new Date().toISOString()
  }

  const { error } = await admin.from('feedbacks').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 })

  return NextResponse.json({ ok: true, lido_em: update.lido_em, resposta: update.resposta_profissional ?? null })
}
