import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FinanceiroGate from '@/components/financeiro/FinanceiroGate'
import ControleFinanceiro from '@/components/financeiro/ControleFinanceiro'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Controle Financeiro — BarberMeta',
}

const CHECKOUT_URL = 'https://pay.hotmart.com/P106317414B'

export default async function FinanceiroPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Le nome + logo da barbearia pra passar ao componente — usado no card
  // de pagamento (PNG) gerado pra cada colaborador.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearias(nome, logo_url)')
    .eq('id', user.id).single() as
    { data: { barbearias: { nome: string; logo_url: string | null } | null } | null }

  const barbeariaNome = usuario?.barbearias?.nome ?? 'Barbearia'
  const barbeariaLogo = usuario?.barbearias?.logo_url ?? null

  return (
    <FinanceiroGate checkoutUrl={CHECKOUT_URL}>
      <ControleFinanceiro barbeariaNome={barbeariaNome} barbeariaLogo={barbeariaLogo} />
    </FinanceiroGate>
  )
}
