import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarCodigoResgate } from '@/lib/utils'

/**
 * Cron de brinde mínimo: atribui o `feedback_brinde_minimo_id` da
 * barbearia aos feedbacks que ficaram SEM brinde por > 24h.
 *
 * Isso acontece quando a barbearia não tinha nenhum brinde ativo no
 * momento do envio do feedback. O dono pode configurar um "brinde
 * mínimo garantido" pra essas situações.
 *
 * Protegido por CRON_SECRET (header Authorization: Bearer <secret>).
 * Configurado em vercel.json pra rodar 1x por hora.
 */
export async function GET(request: Request) {
  // Vercel cron envia 'Authorization: Bearer <CRON_SECRET>'.
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Feedbacks pendentes: sem brinde + criados há > 24h, em barbearias que
  // têm brinde_minimo_id configurado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendentesRaw } = await (admin as any)
    .from('feedbacks_cliente')
    .select('id, barbearia_id, barbearias(feedback_brinde_minimo_id), brindes:feedback_brinde_minimo_id(id, nome)')
    .is('brinde_id', null)
    .lt('created_at', cutoff)
    .eq('arquivado', false)
    .limit(500)

  const pendentes = (pendentesRaw ?? []) as Array<{
    id: string
    barbearia_id: string
    barbearias: { feedback_brinde_minimo_id: string | null } | null
  }>

  let atribuidos = 0
  for (const fb of pendentes) {
    const brindeMinimoId = fb.barbearias?.feedback_brinde_minimo_id
    if (!brindeMinimoId) continue
    const codigo = await gerarCodigoUnico(admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('feedbacks_cliente')
      .update({
        brinde_id: brindeMinimoId,
        codigo_resgate: codigo,
        brinde_atribuido_em: new Date().toISOString(),
      })
      .eq('id', fb.id)
    atribuidos++
  }

  return NextResponse.json({ ok: true, pendentes: pendentes.length, atribuidos })
}

async function gerarCodigoUnico(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const cand = gerarCodigoResgate()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('feedbacks_cliente')
      .select('id').eq('codigo_resgate', cand).maybeSingle()
    if (!data) return cand
  }
  return gerarCodigoResgate() + Math.random().toString(36).slice(2, 5).toUpperCase()
}
