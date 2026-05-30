'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'

export default function LimpezaSection() {
  const router = useRouter()
  const [confirmar, setConfirmar] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function limpar() {
    setFeedback(null)
    startTransition(async () => {
      try {
        const r = await fetch('/api/admin/limpar-atividades', { method: 'POST' })
        const j = await r.json()
        if (!r.ok) {
          setFeedback(j?.error ?? 'Não foi possível limpar.')
          return
        }
        setFeedback('Atividade da equipe limpa.')
        setConfirmar(false)
        router.refresh()
      } catch {
        setFeedback('Sem conexão. Tente novamente.')
      }
    })
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <Trash2 size={20} strokeWidth={1.5} color="#8B6F47" /> Limpeza
        </h2>
        <p className="text-sm text-chumbo mt-1">
          Zera o histórico de leituras e respostas dos colaboradores. Os textos das observações e categorias ficam intactos.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setConfirmar(true)}
        disabled={isPending}
        className="btn-secondary w-full"
      >
        Limpar atividade da equipe
      </button>

      {feedback && <p className="text-sm text-chumbo">{feedback}</p>}

      <Modal open={confirmar} onClose={() => setConfirmar(false)}>
        <div className="p-5">
          <h4 className="font-semibold text-text mb-2">Limpar atividade da equipe?</h4>
          <p className="text-sm text-grafite mb-5">
            Isso zera todas as confirmações de leitura e respostas dos colaboradores. A ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={limpar}
              disabled={isPending}
              className="btn-destrutivo flex-1"
            >
              {isPending ? 'Limpando…' : 'Sim, limpar'}
            </button>
            <button type="button" onClick={() => setConfirmar(false)} className="text-grafite hover:text-text px-4">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
