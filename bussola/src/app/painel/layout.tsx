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
    <div className="min-h-screen">
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/painel" className="min-w-0">
            <span className="block text-lg font-bold text-primary leading-tight">Bússola</span>
            <span className="block text-xs text-text-muted truncate">{estabelecimento.nome}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/painel/atividade" className="relative px-2 py-1 text-lg" aria-label="Atividade">
              🔔
              {novas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {novas > 9 ? '9+' : novas}
                </span>
              )}
            </Link>
            <form action={sair}>
              <button type="submit" className="btn-secondary px-3 py-2 text-sm">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto sm:flex">
        <NavPainel />
        <main className="flex-1 min-w-0 pb-20 sm:pb-0">{children}</main>
      </div>
    </div>
  )
}
