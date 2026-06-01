import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import {
  CATEGORIAS_TUTORIAL,
  type TutorialResumo,
  tempoLeituraMin,
} from '@/lib/tutoriais'

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
          const Icon = cat.icone
          return (
            <section key={cat.key} className="space-y-3">
              <h2 className="inline-flex items-center gap-2 font-semibold text-text">
                <Icon size={18} strokeWidth={1.5} color="#8B6F47" />
                {cat.nome}
                <span className="text-xs font-normal text-chumbo">
                  · {items.length} {items.length === 1 ? 'tutorial' : 'tutoriais'}
                </span>
              </h2>
              <div className="space-y-2">
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/painel/tutoriais/${t.id}`}
                    className="card p-4 flex items-center gap-3 hover:bg-linho/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text">{t.titulo}</p>
                      {t.descricao_curta && (
                        <p className="text-sm text-chumbo mt-0.5 line-clamp-1">{t.descricao_curta}</p>
                      )}
                      <p className="text-xs text-grafite mt-1.5">
                        {t.num_passos} {t.num_passos === 1 ? 'passo' : 'passos'} ·{' '}
                        {tempoLeituraMin(t.num_passos)} min de leitura
                        {t.concluido && (
                          <span className="inline-flex items-center gap-1 ml-2 text-verde-musgo">
                            · <CheckCircle2 size={12} strokeWidth={1.5} /> Concluído
                          </span>
                        )}
                      </p>
                    </div>
                    {t.concluido ? (
                      <CheckCircle2 size={22} strokeWidth={1.5} className="shrink-0 text-verde-musgo" />
                    ) : (
                      <ChevronRight size={22} strokeWidth={1.5} className="shrink-0 text-chumbo" />
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
