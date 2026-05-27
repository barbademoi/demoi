'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Clock, MessageCircle, CheckCircle2, Eye } from 'lucide-react'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
import { TIPO_VISUAL } from '@/components/tipoVisual'
import {
  TIPOS,
  tempoRelativo,
  dataLonga,
  type FeedbackComProfissional,
} from '@/lib/feedbacks'
import { excluirFeedback } from '@/app/painel/feedback/actions'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  discutido_reuniao: 'Discutido na reunião',
  discutido_particular: 'Tratado em particular',
  arquivado: 'Arquivado',
}

export default function FeedbackItem({
  feedback,
  variante,
}: {
  feedback: FeedbackComProfissional
  variante: 'home' | 'perfil'
}) {
  const router = useRouter()
  const [confirmar, setConfirmar] = useState(false)
  const [isPending, startTransition] = useTransition()
  const meta = TIPOS[feedback.tipo]
  const visual = TIPO_VISUAL[feedback.tipo]
  const Icon = visual.Icon

  // Visibilidade pro profissional: null = nunca compartilhado; futuro = em carência.
  const compartilhado = !!feedback.visivel_profissional_em
  const emCarencia =
    compartilhado && new Date(feedback.visivel_profissional_em!).getTime() > Date.now()
  const restanteMin = emCarencia
    ? Math.max(1, Math.ceil((new Date(feedback.visivel_profissional_em!).getTime() - Date.now()) / 60000))
    : 0

  function excluir() {
    startTransition(async () => {
      const res = await excluirFeedback(feedback.id)
      if (!res?.error) {
        setConfirmar(false)
        router.refresh()
      }
    })
  }

  const textoHome =
    feedback.texto.length > 60 ? `${feedback.texto.slice(0, 60)}…` : feedback.texto

  return (
    <div className={`card p-4 border-l-[3px] ${visual.bordaEsq}`}>
      <div className="flex items-start gap-3">
        {variante === 'home' && feedback.profissionais && (
          <Link href={`/painel/profissionais/${feedback.profissional_id}`} className="shrink-0">
            <Avatar nome={feedback.profissionais.nome} fotoUrl={feedback.profissionais.foto_url} size={40} />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {variante === 'home' && feedback.profissionais && (
              <Link
                href={`/painel/profissionais/${feedback.profissional_id}`}
                className="font-medium text-text hover:text-marrom truncate"
              >
                {feedback.profissionais.nome}
              </Link>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${visual.badge}`}>
              <Icon size={14} strokeWidth={1.5} />
              {visual.label}
            </span>
            <Estrelas value={feedback.estrelas ?? 0} readOnly size={14} cor={meta.estrela} />
          </div>

          <p className={`text-sm text-text mt-1 ${variante === 'perfil' ? 'whitespace-pre-wrap' : ''}`}>
            {variante === 'home' ? textoHome : feedback.texto}
          </p>

          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-chumbo">
            <span>{variante === 'home' ? tempoRelativo(feedback.created_at) : dataLonga(feedback.created_at)}</span>
            {feedback.categoria && (
              <span className="bg-linho text-grafite rounded-full px-2 py-0.5">{feedback.categoria}</span>
            )}
            {variante === 'perfil' && (
              <span>· {STATUS_LABEL[feedback.status] ?? feedback.status}</span>
            )}
            {variante === 'perfil' && emCarencia && (
              <span className="inline-flex items-center gap-1 text-ambar" title="Ainda não visível pro profissional. Você pode editar ou excluir.">
                · <Clock size={13} strokeWidth={1.5} /> Em carência · {restanteMin} min
              </span>
            )}
            {variante === 'perfil' && compartilhado && !emCarencia && (
              feedback.resposta_profissional ? (
                <span className="inline-flex items-center gap-1 text-azul-noite" title={feedback.resposta_profissional}>
                  · <MessageCircle size={13} strokeWidth={1.5} /> Respondeu
                </span>
              ) : feedback.lido_em ? (
                <span className="inline-flex items-center gap-1 text-verde-musgo">
                  · <CheckCircle2 size={13} strokeWidth={1.5} /> Lido
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-chumbo">
                  · <Eye size={13} strokeWidth={1.5} /> Não leu
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/painel/feedback/${feedback.id}/editar`}
            className="text-chumbo hover:text-marrom p-1.5"
            aria-label="Editar"
          >
            <Pencil size={18} strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="text-chumbo hover:text-vinho p-1.5"
            aria-label="Excluir"
          >
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmar(false)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Excluir este feedback?</h4>
            <p className="text-sm text-grafite mb-5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={excluir}
                disabled={isPending}
                className="btn-destrutivo flex-1"
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="text-grafite hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
