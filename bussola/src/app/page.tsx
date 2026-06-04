import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from './landing/page'

// Raiz do site: mostra a landing pra visitantes não-autenticados.
// Autenticados são redirecionados direto pro /painel (ou /onboarding
// se ainda não criaram estabelecimento).
export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: estabelecimento } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('dono_id', user.id)
      .maybeSingle()
    redirect(estabelecimento ? '/painel' : '/onboarding')
  }

  return <LandingPage />
}
