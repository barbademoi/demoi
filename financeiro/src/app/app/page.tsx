import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FinanceiroGate from '@/components/financeiro/FinanceiroGate'
import ControleFinanceiro from '@/components/financeiro/ControleFinanceiro'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Controle Financeiro' }

const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_HOTMART_URL || 'https://pay.hotmart.com/P106317414B'

export default async function AppPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')

  // Se o usuário também é dono de barbearia no BarberMeta (mesmo Supabase),
  // lê nome + logo pra usar no card de pagamento. Cliente standalone sem
  // barbearia simplesmente cai no fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearias(nome, logo_url)')
    .eq('id', user.id).maybeSingle() as
    { data: { barbearias: { nome: string; logo_url: string | null } | null } | null }

  const barbeariaNome = usuario?.barbearias?.nome ?? 'Minha barbearia'
  const barbeariaLogo = usuario?.barbearias?.logo_url ?? null

  return (
    <FinanceiroGate checkoutUrl={CHECKOUT_URL}>
      <ControleFinanceiro barbeariaNome={barbeariaNome} barbeariaLogo={barbeariaLogo} />
    </FinanceiroGate>
  )
}
