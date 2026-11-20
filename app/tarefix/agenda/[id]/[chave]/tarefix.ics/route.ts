import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { chaveConfere, gerarIcs } from '@/lib/tarefix/agenda'

// perto do banco (Supabase em us-west-2), como o resto do Tarefix
export const preferredRegion = 'pdx1'

// Agenda .ics assinada pelo app de calendário do celular (sem login: a chave
// no endereço é derivada do token do colaborador).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { id: string; chave: string } }) {
  const nada = new Response('Agenda não encontrada', { status: 404 })
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return nada
  const db = createTarefixAdmin()
  const { data: c } = await db.from('colaboradores').select('id, nome, token_acesso, ativo, criado_em, eh_dono, empresa_id').eq('id', params.id).maybeSingle()
  if (!c || !c.ativo || !chaveConfere(c, params.chave)) return nada
  const { data: empresa } = await db.from('empresas').select('ativo').eq('id', c.empresa_id).maybeSingle()
  if (!empresa || empresa.ativo === false) return nada
  const base = new URL(req.url).origin
  const ics = await gerarIcs(c, base, db)
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="tarefix.ics"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
