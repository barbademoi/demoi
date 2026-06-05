import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  CATEGORIAS_TUTORIAL,
  type TutorialResumo,
} from '@/lib/tutoriais'
import { CategoriaTutoriais } from './CategoriaTutoriais'

export const dynamic = 'force-dynamic'

export default async function TutoriaisPage() {
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
    .select('id, categoria, titulo, descricao_curta, ordem, tutorial_passos(count)')
    .eq('ativo', true)
    .order('categoria', { ascending: true })
    .order('ordem', { ascending: true })

  const { data: lidos } = await supabase
    .from('tutoriais_lidos')
    .select('tutorial_id')
    .eq('estabelecimento_id', est.id)
  const lidosSet = new Set((lidos ?? []).map((l) => l.tutorial_id as string))

  const lista: TutorialResumo[] = (tuts ?? []).map((t) => {
    const countArr = t.tutorial_passos as unknown as { count: number }[] | null
    const numPassos = countArr?.[0]?.count ?? 0
    return {
      id: t.id as string,
      categoria: t.categoria as TutorialResumo['categoria'],
      titulo: t.titulo as string,
      descricao_curta: (t.descricao_curta as string | null) ?? null,
      ordem: t.ordem as number,
      num_passos: numPassos,
      concluido: lidosSet.has(t.id as string),
    }
  })

  const total = lista.length
  const concluidos = lista.filter((t) => t.concluido).length
  const pctTotal = total > 0 ? Math.round((concluidos / total) * 100) : 0

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-xl font-semibold text-text">Tutoriais</h1>
        <p className="text-sm text-chumbo mt-1">
          Aprenda a usar a Bússola passo a passo.
        </p>
        <div className="mt-4 space-y-1.5">
          <p className="text-sm text-grafite">
            Você concluiu <span className="font-medium text-text">{concluidos}</span> de{' '}
            <span className="font-medium text-text">{total}</span> tutoriais.
          </p>
          <div className="h-2 w-full rounded-full bg-linho overflow-hidden">
            <div
              className="h-full bg-marrom transition-all"
              style={{ width: `${pctTotal}%` }}
              aria-label={`${pctTotal}% concluído`}
            />
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {CATEGORIAS_TUTORIAL.map((cat) => {
          const items = lista.filter((t) => t.categoria === cat.key)
          if (items.length === 0) return null
          return <CategoriaTutoriais key={cat.key} cat={cat} items={items} />
        })}
      </div>
    </main>
  )
}
