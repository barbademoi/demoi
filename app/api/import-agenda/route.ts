import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cicloDeData } from '@/lib/ciclo'
import { estaFechado } from '@/lib/mesFechado'

/**
 * IMPORT DA EXTENSÃO (Agenda Serviço → BarberMeta).
 *
 * Recebe da extensão de Chrome os dados JÁ EXTRAÍDOS do relatório do Agenda
 * Serviço (reaproveitando a sessão logada do dono no navegador dele) e grava
 * no MESMO modelo do lançamento diário: acumulado por barbeiro no ciclo +
 * "foto" do dia em lancamentos_diarios (sobrescreve o dia se reenviado, não
 * duplica). Nada de senha — a extensão nunca manda credencial; este endpoint
 * é protegido por TOKEN (AGENDA_IMPORT_TOKEN) e atrela à conta configurada em
 * AGENDA_IMPORT_EMAIL. Fuso America/Sao_Paulo (ciclo via dia_fechamento).
 *
 * Payload:
 * {
 *   referencia: "YYYY-MM-DD",           // dia do relatório (define o ciclo)
 *   barbeiros: [{ nome, faturamento?, comissao?, servicos?, produtos?,
 *                 assinaturas?, atendimentos? }],  // ACUMULADO do ciclo
 *   casa?: { faturamento?, servicos?, produtos?, assinaturas? }  // totais da
 *                 // barbearia (fonte JSON confiável do Agenda Serviço); quando
 *                 // presente, define o faturamento da meta da casa direto.
 * }
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

function normalizarNome(n: string): string {
  return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}
const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

interface BarbeiroPayload {
  nome: string
  faturamento?: number
  comissao?: number
  servicos?: number
  produtos?: number
  assinaturas?: number
  atendimentos?: number
}

interface CasaPayload {
  faturamento?: number
  servicos?: number
  produtos?: number
  assinaturas?: number
}

export async function POST(request: NextRequest) {
  // ── 1. Token ──────────────────────────────────────────────────────────────
  const token = process.env.AGENDA_IMPORT_TOKEN
  const email = process.env.AGENDA_IMPORT_EMAIL
  if (!token || !email) {
    console.error('[import-agenda] AGENDA_IMPORT_TOKEN/EMAIL não configurados')
    return NextResponse.json({ error: 'Importação indisponível no momento.' }, { status: 500 })
  }
  const auth = request.headers.get('authorization') ?? ''
  const enviado = auth.replace(/^Bearer\s+/i, '').trim() || request.headers.get('x-import-token') || ''
  if (enviado !== token) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // ── 2. Payload ────────────────────────────────────────────────────────────
  let body: { referencia?: string; barbeiros?: BarbeiroPayload[]; casa?: CasaPayload }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const referencia = String(body.referencia ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referencia)) return NextResponse.json({ error: 'referencia inválida (YYYY-MM-DD).' }, { status: 400 })
  const barbeirosPayload = Array.isArray(body.barbeiros) ? body.barbeiros : []
  if (barbeirosPayload.length === 0) return NextResponse.json({ error: 'Nenhum barbeiro no payload.' }, { status: 400 })
  const casa = body.casa && typeof body.casa === 'object' ? body.casa : null

  const supabase: Supa = createAdminClient()

  // ── 3. Conta (só minha) + config ──────────────────────────────────────────
  const { data: usuario } = await supabase
    .from('usuarios').select('barbearia_id').eq('email', email).maybeSingle()
  const barbeariaId = (usuario as { barbearia_id: string } | null)?.barbearia_id
  if (!barbeariaId) return NextResponse.json({ error: 'Conta configurada não encontrada.' }, { status: 500 })

  const { data: cfg } = await supabase
    .from('barbearias').select('dia_fechamento, modo_meta, base_meta').eq('id', barbeariaId).single()
  const diaFechamento = (cfg?.dia_fechamento as number | null) ?? 1
  const modoMeta = (cfg?.modo_meta ?? 'comissao') as 'faturamento' | 'comissao' | 'ambos'
  const baseMeta = (cfg?.base_meta ?? 'comissao') as 'faturamento' | 'comissao'
  const base: 'faturamento' | 'comissao' = modoMeta === 'ambos' ? baseMeta : (modoMeta as 'faturamento' | 'comissao')

  // ── 4. Ciclo (fuso BR) + trava de mês fechado ─────────────────────────────
  const ciclo = cicloDeData(new Date(referencia + 'T12:00:00'), diaFechamento)
  const mes = ciclo.mesRef, ano = ciclo.anoRef
  const trava = await estaFechado(supabase, barbeariaId, mes, ano)
  if (trava.fechado) return NextResponse.json({ error: `Ciclo ${ciclo.label} está fechado. Reabra pra importar.` }, { status: 409 })

  // ── 5. De-para por nome (Agenda Serviço → barbeiro do BarberMeta) ─────────
  const { data: barbsRaw } = await supabase
    .from('barbeiros').select('id, nome').eq('barbearia_id', barbeariaId).eq('ativo', true)
  const porNome = new Map<string, { id: string; nome: string }>()
  for (const b of (barbsRaw ?? []) as { id: string; nome: string }[]) porNome.set(normalizarNome(b.nome), b)

  const naoEncontrados: string[] = []
  const atualizados: string[] = []
  let somaFatCasa = 0, somaAtendCasa = 0

  for (const p of barbeirosPayload) {
    const alvo = porNome.get(normalizarNome(String(p.nome ?? '')))
    if (!alvo) { naoEncontrados.push(String(p.nome ?? '(sem nome)')); continue }

    const fat = num(p.faturamento)
    const com = num(p.comissao)
    const atend = num(p.atendimentos)
    const espelho = base === 'faturamento' ? fat : com

    // Anti-zerar: se veio tudo zero mas já tem valor gravado, preserva.
    const { data: exist } = await supabase
      .from('lancamentos').select('comissao_acumulada, valor_faturamento, valor_comissao, numero_atendimentos')
      .eq('barbearia_id', barbeariaId).eq('barbeiro_id', alvo.id).eq('mes', mes).eq('ano', ano).maybeSingle()
    const tinha = exist && ((Number(exist.comissao_acumulada) || 0) > 0 || (Number(exist.valor_faturamento) || 0) > 0 || (Number(exist.valor_comissao) || 0) > 0 || (Number(exist.numero_atendimentos) || 0) > 0)
    if (fat === 0 && com === 0 && atend === 0 && tinha) continue

    // Acumulado do ciclo (sobrescreve — igual definirAcumuladoMes).
    const row: Record<string, unknown> = {
      barbearia_id: barbeariaId, barbeiro_id: alvo.id, mes, ano, numero_atendimentos: atend, modo: 'direto',
    }
    if (fat > 0 || base === 'faturamento') row.valor_faturamento = fat
    if (com > 0 || base === 'comissao') row.valor_comissao = com
    row.comissao_acumulada = espelho
    await supabase.from('lancamentos').upsert(row, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })

    // Foto do dia (sobrescreve o dia se reenviado; não duplica).
    await supabase.from('lancamentos_diarios').upsert(
      { barbearia_id: barbeariaId, barbeiro_id: alvo.id, data: referencia, valor: espelho, numero_atendimentos: atend, atualizado_em: new Date().toISOString() },
      { onConflict: 'barbeiro_id,data' },
    )

    somaFatCasa += fat
    somaAtendCasa += atend
    atualizados.push(alvo.nome)
  }

  // ── 6. Totais da casa (metas) — só se a meta já existe ────────────────────
  const { data: metaRaw } = await supabase
    .from('metas').select('id, faturamento_acumulado, numero_atendimentos')
    .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle()
  if (metaRaw) {
    // Faturamento da casa: prefere o total oficial do Agenda Serviço (casa.faturamento,
    // via endpoint JSON) e cai pra soma dos barbeiros só se ele não veio.
    const fatCasa = casa && num(casa.faturamento) > 0 ? num(casa.faturamento) : somaFatCasa
    const patch: Record<string, number> = {}
    if (fatCasa > 0) patch.faturamento_acumulado = fatCasa
    if (somaAtendCasa > 0) patch.numero_atendimentos = somaAtendCasa
    if (Object.keys(patch).length > 0) await supabase.from('metas').update(patch).eq('id', metaRaw.id)
  }

  return NextResponse.json({
    ok: true,
    ciclo: ciclo.label,
    atualizados: atualizados.length,
    barbeiros: atualizados,
    naoEncontrados,
  })
}
