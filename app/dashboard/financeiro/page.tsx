import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FinanceiroGate from '@/components/financeiro/FinanceiroGate'
import ControleFinanceiro from '@/components/financeiro/ControleFinanceiro'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Controle Financeiro — BarberMeta',
}

// Rota do modulo Financeiro. Auth de login eh feito pelo middleware
// (middleware.ts) — quem nao tem sessao cai pra /login antes daqui.
// O paywall (entitlement por compra) eh feito no client pelo FinanceiroGate
// via RPC has_financeiro(); a trava REAL eh no RLS do banco.
//
// checkoutUrl: link da Hotmart do adicional "Controle Financeiro".
// Quem ainda nao comprou, vai cair no FinanceiroGate e clica em
// "Desbloquear agora" — abre esse link.
const CHECKOUT_URL = 'https://pay.hotmart.com/P106317414B'

export default async function FinanceiroPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <FinanceiroGate checkoutUrl={CHECKOUT_URL}>
      <ControleFinanceiro />
    </FinanceiroGate>
  )
}
