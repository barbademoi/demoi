import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar')
  }

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id, nome, ultima_visita_home')
    .eq('dono_id', user.id)
    .maybeSingle()

  if (!estabelecimento) {
    redirect('/onboarding')
  }

  // Badge de novidades (leituras/respostas desde a última visita à Home).
  const uv = estabelecimento.ultima_visita_home ?? '1970-01-01T00:00:00Z'
  const { count } = await supabase
    .from('feedbacks')
    .select('id', { count: 'exact', head: true })
    .eq('estabelecimento_id', estabelecimento.id)
    .or(`lido_em.gt.${uv},resposta_em.gt.${uv}`)
  const novas = count ?? 0

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar nomeEstab={estabelecimento.nome} email={user.email ?? ''} novas={novas} />

      <div className="flex-1 min-w-0">
        {/* Header só no mobile (no desktop o logo fica na sidebar) */}
        <header className="lg:hidden bg-surface border-b border-border sticky top-0 z-20 px-4 py-3">
          <Link href="/painel" className="block min-w-0">
            <span className="block font-serif text-xl text-preto leading-tight">Bússola</span>
            <span className="block text-xs text-chumbo truncate">{estabelecimento.nome}</span>
          </Link>
        </header>

        <main className="max-w-4xl mx-auto pb-20 lg:pb-8">{children}</main>
      </div>

      <BottomNav novas={novas} />
    </div>
  )
}
