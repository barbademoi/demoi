'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
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
    <div className="card p-4">
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
                className="font-medium text-text hover:text-primary truncate"
              >
                {feedback.profissionais.nome}
              </Link>
            )}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
            </span>
            <Estrelas value={feedback.estrelas ?? 0} readOnly size={14} cor={meta.estrela} />
          </div>

          <p className={`text-sm text-text mt-1 ${variante === 'perfil' ? 'whitespace-pre-wrap' : ''}`}>
            {variante === 'home' ? textoHome : feedback.texto}
          </p>

          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-text-muted">
            <span>{variante === 'home' ? tempoRelativo(feedback.created_at) : dataLonga(feedback.created_at)}</span>
            {feedback.categoria && (
              <span className="bg-primary-soft text-primary rounded-full px-2 py-0.5">{feedback.categoria}</span>
            )}
            {variante === 'perfil' && (
              <span className="text-text-muted/80">· {STATUS_LABEL[feedback.status] ?? feedback.status}</span>
            )}
            {variante === 'perfil' && emCarencia && (
              <span className="text-orange-600" title="Ainda não visível pro profissional. Você pode editar ou excluir.">
                · 🕐 Em carência · {restanteMin} min
              </span>
            )}
            {variante === 'perfil' && compartilhado && !emCarencia && (
              feedback.resposta_profissional ? (
                <span className="text-blue-600" title={feedback.resposta_profissional}>· 💬 Respondeu</span>
              ) : feedback.lido_em ? (
                <span className="text-green-600">· ✓ Lido</span>
              ) : (
                <span className="text-text-muted/60">· 👁 Não leu</span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/painel/feedback/${feedback.id}/editar`}
            className="text-text-muted hover:text-primary p-1.5"
            aria-label="Editar"
          >
            ✎
          </Link>
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="text-text-muted hover:text-red-600 p-1.5"
            aria-label="Excluir"
          >
            🗑
          </button>
        </div>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmar(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Excluir este feedback?</h4>
            <p className="text-sm text-text-muted mb-5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={excluir}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="text-text-muted hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
