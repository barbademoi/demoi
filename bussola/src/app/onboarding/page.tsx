import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar')
  }

  // Já tem estabelecimento? Não precisa refazer onboarding.
  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()

  if (estabelecimento) {
    redirect('/painel')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text mb-2">Vamos configurar</h1>
          <p className="text-chumbo text-sm">
            Conte um pouco sobre a sua empresa.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
