import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Pencil, ChevronLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { CATEGORIAS_TUTORIAL, categoriaPorKey } from '@/lib/tutoriais'
import ToggleAtivo from './ToggleAtivo'

export const dynamic = 'force-dynamic'

export default async function AdminTutoriaisPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const { data: tuts } = await supabase
    .from('tutoriais')
    .select('id, categoria, titulo, descricao_curta, ordem, ativo, tutorial_passos(count)')
    .order('categoria')
    .order('ordem')

  const lista = (tuts ?? []).map((t) => {
    const countArr = t.tutorial_passos as unknown as { count: number }[] | null
    return {
      id: t.id as string,
      categoria: t.categoria as string,
      titulo: t.titulo as string,
      descricao_curta: (t.descricao_curta as string | null) ?? null,
      ativo: !!t.ativo,
      num_passos: countArr?.[0]?.count ?? 0,
    }
  })

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <Link href="/painel/configuracoes" className="inline-flex items-center gap-1 text-sm text-grafite">
        <ChevronLeft size={16} strokeWidth={1.5} /> Configurações
      </Link>

      <header>
        <h1 className="text-xl font-semibold text-text">Editar tutoriais</h1>
        <p className="text-sm text-chumbo mt-1">
          Estes tutoriais são compartilhados entre todas as empresas que usam a Bússola.
          Editar aqui afeta todos os usuários.
        </p>
      </header>

      <div className="space-y-6">
        {CATEGORIAS_TUTORIAL.map((cat) => {
          const items = lista.filter((t) => t.categoria === cat.key)
          if (items.length === 0) return null
          const Icon = cat.icone
          return (
            <section key={cat.key} className="space-y-2">
              <h2 className="inline-flex items-center gap-2 font-semibold text-text">
                <Icon size={18} strokeWidth={1.5} color="#8B6F47" /> {cat.nome}
              </h2>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text">{t.titulo}</p>
                        {t.descricao_curta && (
                          <p className="text-sm text-chumbo mt-0.5 line-clamp-1">{t.descricao_curta}</p>
                        )}
                        <p className="text-xs text-grafite mt-1">
                          {t.num_passos} {t.num_passos === 1 ? 'passo' : 'passos'}{!t.ativo && ' · oculto'}
                        </p>
                      </div>
                      <ToggleAtivo id={t.id} ativo={t.ativo} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/painel/configuracoes/tutoriais/${t.id}`}
                        className="btn-secondary text-sm"
                      >
                        <Pencil size={14} strokeWidth={1.5} /> Editar conteúdo
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
        {lista.length === 0 && (
          <p className="text-chumbo text-sm">
            Nenhum tutorial cadastrado. Rode a migration 016 e recarregue.
          </p>
        )}
      </div>
      <p className="sr-only">{categoriaPorKey('primeiros_passos')?.nome}</p>
    </main>
  )
}
