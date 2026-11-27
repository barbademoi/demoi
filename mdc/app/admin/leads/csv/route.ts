import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consultarLeads, type Lead } from '@/lib/leads'
import { dataHoraBR, formatarWhatsapp } from '@/lib/format'
import { DISPOSICAO, DOR, FATURAMENTO, ORIGEM, PERFIL, STATUS_LEAD, rotulo } from '@/lib/opcoes'

export const dynamic = 'force-dynamic'

function celula(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  // Evita fórmula maliciosa ao abrir no Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: ehAdmin } = await supabase.rpc('is_admin')
  if (!ehAdmin) return new NextResponse('Sem permissão', { status: 403 })

  const sp = request.nextUrl.searchParams
  const { data, error } = await consultarLeads(supabase, {
    q: sp.get('q') || undefined,
    perfil: sp.get('perfil') || undefined,
    disposicao: sp.get('disposicao') || undefined,
    faturamento: sp.get('faturamento') || undefined,
    cidade: sp.get('cidade') || undefined,
    status: sp.get('status') || undefined,
  })
  if (error) return new NextResponse(error.message, { status: 500 })

  const cab = ['Entrou em', 'Nome', 'WhatsApp', 'Cidade', 'UF', 'Perfil', 'Disposto a investir', 'Instagram', 'Barbeiros', 'Faturamento', 'Maior dor', 'Conheceu por', 'Status', 'Anotações', 'UTM']
  const linhas = (data as Lead[]).map((l) =>
    [
      dataHoraBR(l.created_at),
      l.nome,
      formatarWhatsapp(l.whatsapp),
      l.cidade,
      l.uf,
      rotulo(PERFIL, l.perfil),
      rotulo(DISPOSICAO, l.disposicao),
      l.instagram ? `@${l.instagram}` : '',
      l.num_barbeiros ?? '',
      rotulo(FATURAMENTO, l.faturamento),
      l.dor === 'outro' ? `Outro: ${l.dor_outro ?? ''}` : rotulo(DOR, l.dor),
      rotulo(ORIGEM, l.origem),
      rotulo(STATUS_LEAD, l.status),
      l.notas ?? '',
      l.utm ? Object.entries(l.utm).map(([k, v]) => `${k}=${v}`).join(' ') : '',
    ]
      .map(celula)
      .join(';'),
  )
  // ; e BOM: abre certinho no Excel em português.
  const csv = '﻿' + [cab.map(celula).join(';'), ...linhas].join('\r\n')
  const nome = `leads-mdc-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}"`,
    },
  })
}
