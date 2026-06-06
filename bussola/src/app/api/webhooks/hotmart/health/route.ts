import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Health check público pra monitoramento externo (UptimeRobot, etc).
// Verifica que tabelas existem + env vars configuradas + última atividade.
// Retorna 200 se TUDO OK, 503 se algo crítico está quebrado.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface CheckResult {
  ok: boolean
  detail?: string
}

export async function GET() {
  const checks: Record<string, CheckResult> = {}

  // 1) Env vars
  checks.env_hotmart_hottok = { ok: !!process.env.HOTMART_HOTTOK }
  checks.env_supabase_service_role = { ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY }
  checks.env_supabase_url = { ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL }

  // Sem service role não dá nem pra checar o resto
  if (!checks.env_supabase_service_role.ok) {
    return NextResponse.json({ ok: false, checks }, { status: 503 })
  }

  const admin = createAdminClient()

  // 2) Tabelas críticas existem?
  const tabelas = ['estabelecimentos', 'compras_hotmart', 'webhooks_recebidos']
  for (const t of tabelas) {
    try {
      const { error } = await admin.from(t).select('id', { head: true, count: 'exact' }).limit(1)
      checks[`tabela_${t}`] = { ok: !error, detail: error?.message }
    } catch (e) {
      checks[`tabela_${t}`] = {
        ok: false,
        detail: e instanceof Error ? e.message : 'erro desconhecido',
      }
    }
  }

  // 3) Último webhook recebido (se nenhum nas últimas 72h pode indicar
  // problema com config Hotmart; só avisa, não falha)
  try {
    const { data: ultimo } = await admin
      .from('webhooks_recebidos')
      .select('recebido_em')
      .order('recebido_em', { ascending: false })
      .limit(1)
      .maybeSingle()
    const tempo = ultimo?.recebido_em
      ? `há ${humanRelative(new Date(ultimo.recebido_em))}`
      : 'nenhum registrado'
    checks.ultimo_webhook = { ok: true, detail: tempo }
  } catch {
    /* tabela não existe — já capturado acima */
  }

  // 4) Pendências de processamento
  try {
    const { count } = await admin
      .from('webhooks_recebidos')
      .select('id', { head: true, count: 'exact' })
      .eq('processado', false)
    checks.webhooks_pendentes = {
      ok: (count ?? 0) === 0,
      detail: `${count ?? 0} webhooks não processados`,
    }
  } catch {
    /* tabela não existe */
  }

  const tudoOk = Object.values(checks).every((c) => c.ok)

  return NextResponse.json(
    {
      ok: tudoOk,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: tudoOk ? 200 : 503 },
  )
}

function humanRelative(date: Date): string {
  const ms = Date.now() - date.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d} dias`
}
