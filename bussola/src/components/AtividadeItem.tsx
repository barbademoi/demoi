import Avatar from './Avatar'
import { tempoRelativo, type TipoFeedback } from '@/lib/feedbacks'

export interface AtividadeFb {
  id: string
  tipo: TipoFeedback
  texto: string
  lido_em: string | null
  resposta_profissional: string | null
  resposta_em: string | null
  profissionais: { nome: string; foto_url: string | null } | null
}

const TIPO_LABEL: Record<TipoFeedback, string> = {
  positivo: 'um elogio',
  negativo: 'um ponto a desenvolver',
  observacao: 'uma observação',
}

const TIPO_ICONE: Record<TipoFeedback, string> = {
  positivo: '✨',
  negativo: '🌱',
  observacao: '📝',
}

export default function AtividadeItem({ a }: { a: AtividadeFb }) {
  const respondeu = !!a.resposta_profissional
  const quando = a.resposta_em ?? a.lido_em
  const nome = a.profissionais?.nome ?? '—'
  const trecho = a.texto.length > 60 ? `${a.texto.slice(0, 60)}…` : a.texto
  const label = TIPO_LABEL[a.tipo]
  const acao = respondeu ? `respondeu a ${label}` : `leu ${label}`

  return (
    <div className="card p-3 flex items-start gap-3">
      <Avatar nome={nome} fotoUrl={a.profissionais?.foto_url} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium text-text">{nome}</span>{' '}
          <span className="text-text-muted">{TIPO_ICONE[a.tipo]} {acao}</span>
        </p>
        <p className="text-xs text-text-muted truncate">“{trecho}”</p>
        {respondeu && <p className="text-sm text-text italic mt-1">{a.resposta_profissional}</p>}
        <p className="text-xs text-text-muted/80 mt-0.5">{quando ? tempoRelativo(quando) : ''}</p>
      </div>
    </div>
  )
}
