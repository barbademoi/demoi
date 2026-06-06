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

  // Tenta com logo_url (migration 015) + ativo (migration 021). Cai
  // gradualmente se faltar coluna.
  let estabelecimento: { id: string; nome: string; ultima_visita_home: string | null; logo_url: string | null; ativo: boolean }
  const completo = await supabase
    .from('estabelecimentos')
    .select('id, nome, ultima_visita_home, logo_url, ativo')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (completo.data) {
    estabelecimento = {
      id: completo.data.id as string,
      nome: completo.data.nome as string,
      ultima_visita_home: (completo.data.ultima_visita_home as string | null) ?? null,
      logo_url: (completo.data.logo_url as string | null) ?? null,
      ativo: (completo.data.ativo as boolean | null) ?? true,
    }
  } else {
    const minimo = await supabase
      .from('estabelecimentos')
      .select('id, nome, ultima_visita_home')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!minimo.data) redirect('/onboarding')
    estabelecimento = {
      id: minimo.data.id as string,
      nome: minimo.data.nome as string,
      ultima_visita_home: (minimo.data.ultima_visita_home as string | null) ?? null,
      logo_url: null,
      ativo: true,
    }
  }

  if (!estabelecimento.ativo) {
    // Refund/cancelamento via Hotmart desativa. Cliente sai do painel.
    await supabase.auth.signOut()
    redirect('/entrar?msg=conta_suspensa')
  }

  // Badge de novidades (leituras/respostas desde a última visita à Home).
  const uv = estabelecimento.ultima_visita_home ?? '1970-01-01T00:00:00Z'
  const { count } = await supabase
    .from('feedbacks')
    .select('id', { count: 'exact', head: true })
    .eq('estabelecimento_id', estabelecimento.id)
    .or(`lido_em.gt.${uv},resposta_em.gt.${uv}`)
  const novas = count ?? 0

  // Badge de mensagens dos colaboradores não lidas (migration 020).
  // Se a migration ainda não rodou, segue com 0 sem quebrar.
  let mensagensNaoLidas = 0
  try {
    const { count: mc } = await supabase
      .from('mensagens_colaboradores')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimento.id)
      .eq('lida', false)
    mensagensNaoLidas = mc ?? 0
  } catch {
    /* migration 020 ausente — sem badge */
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        nomeEstab={estabelecimento.nome}
        email={user.email ?? ''}
        logoUrl={estabelecimento.logo_url}
        novas={novas}
        mensagensNaoLidas={mensagensNaoLidas}
      />

      <div className="flex-1 min-w-0">
        {/* Header só no mobile (no desktop o logo fica na sidebar) */}
        <header className="lg:hidden bg-surface border-b border-border sticky top-0 z-20 px-4 py-3">
          <Link href="/painel" className="flex items-center gap-2.5 min-w-0">
            {estabelecimento.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={estabelecimento.logo_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover bg-linho shrink-0"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logos/logo-simbolo.svg"
                alt="Bússola"
                className="w-9 h-9 rounded-full shrink-0"
              />
            )}
            <span className="min-w-0">
              <span className="block font-serif text-xl text-preto leading-tight">Bússola</span>
              <span className="block text-xs text-chumbo truncate">{estabelecimento.nome}</span>
            </span>
          </Link>
        </header>

        <main className="max-w-4xl mx-auto pb-20 lg:pb-8">{children}</main>
      </div>

      <BottomNav novas={novas} mensagensNaoLidas={mensagensNaoLidas} />
    </div>
  )
}
