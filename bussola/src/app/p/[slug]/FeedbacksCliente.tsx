import { Star } from 'lucide-react'
import { tempoRelativo } from '@/lib/feedbacks'

export interface ItemFeedbackCliente {
  id: string
  nome_cliente: string | null
  identificado: boolean
  estrelas: number
  comentario: string | null
  created_at: string
}

function Estrelas({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.5}
          className={i < n ? 'fill-marrom text-marrom' : 'text-border'}
        />
      ))}
    </span>
  )
}

function Card({ item }: { item: ItemFeedbackCliente }) {
  const nome = item.identificado && item.nome_cliente?.trim()
    ? item.nome_cliente.trim()
    : 'Cliente anônimo'

  return (
    <article className="relative rounded-lg border border-border bg-linho/40 p-4 pl-9 animate-fade-in">
      <Star
        size={16}
        strokeWidth={1.5}
        className="absolute left-3 top-4 fill-marrom text-marrom"
        aria-hidden
      />
      <p className="text-xs text-chumbo">Cliente — há {tempoRelativo(item.created_at)}</p>
      {item.comentario && (
        <p className="text-text text-[15px] leading-relaxed mt-2 whitespace-pre-wrap">{item.comentario}</p>
      )}
      <div className="flex items-center justify-between gap-2 mt-3">
        <Estrelas n={item.estrelas} />
        <span className="text-xs text-grafite">{nome}</span>
      </div>
    </article>
  )
}

export default function FeedbacksCliente({ itens }: { itens: ItemFeedbackCliente[] }) {
  if (itens.length === 0) return null
  return (
    <div className="space-y-3">
      {itens.map((f) => <Card key={f.id} item={f} />)}
    </div>
  )
}
