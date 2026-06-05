'use client'

import Link from 'next/link'
import { CheckCircle2, ChevronRight, type LucideIcon } from 'lucide-react'
import { ListExpander } from '@/components/ui/ListExpander'
import { tempoLeituraMin, type TutorialResumo } from '@/lib/tutoriais'

interface Categoria {
  key: TutorialResumo['categoria']
  nome: string
  icone: LucideIcon
}

export function CategoriaTutoriais({ cat, items }: { cat: Categoria; items: TutorialResumo[] }) {
  const Icon = cat.icone
  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 font-semibold text-text">
        <Icon size={18} strokeWidth={1.5} color="#8B6F47" />
        {cat.nome}
        <span className="text-xs font-normal text-chumbo">
          · {items.length} {items.length === 1 ? 'tutorial' : 'tutoriais'}
        </span>
      </h2>
      <ListExpander
        items={items}
        initialCount={4}
        className="space-y-2"
        showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'tutorial' : 'tutoriais'}`}
        renderItem={(t) => (
          <Link
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
        )}
      />
    </section>
  )
}
