import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import NavPainel from '@/components/NavPainel'
import { sair } from './actions'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
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

  if (!estabelecimento) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/painel" className="min-w-0">
            <span className="block text-lg font-bold text-primary leading-tight">Bússola</span>
            <span className="block text-xs text-text-muted truncate">{estabelecimento.nome}</span>
          </Link>
          <form action={sair}>
            <button type="submit" className="btn-secondary px-3 py-2 text-sm">Sair</button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto sm:flex">
        <NavPainel />
        <main className="flex-1 min-w-0 pb-20 sm:pb-0">{children}</main>
      </div>
    </div>
  )
}
