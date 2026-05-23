import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sair } from './actions'

export default async function PainelPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar')
  }

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('nome')
    .eq('dono_id', user.id)
    .maybeSingle()

  // Sem estabelecimento ainda → completa o onboarding primeiro.
  if (!estabelecimento) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-lg font-bold text-primary leading-tight">Bússola</span>
            <span className="block text-sm text-text-muted truncate">
              {estabelecimento.nome}
            </span>
          </div>
          <form action={sair}>
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-text mb-3">Bem-vindo!</h1>
        <p className="text-text-muted">Em breve mais funcionalidades.</p>
      </main>
    </div>
  )
}
