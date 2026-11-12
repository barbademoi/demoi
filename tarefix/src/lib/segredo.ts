import 'server-only'
import { createHash } from 'crypto'

/**
 * Segredo para assinar o cookie da sessão do colaborador.
 * Usa TAREFIX_SESSION_SECRET se existir; senão deriva da service role key
 * (assim a instalação precisa só das 3 chaves que o Supabase já mostra).
 */
export function segredoSessao(): string {
  const proprio = process.env.TAREFIX_SESSION_SECRET
  if (proprio) return proprio
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  return createHash('sha256').update(`tarefix-sessao:${base}`).digest('hex')
}
