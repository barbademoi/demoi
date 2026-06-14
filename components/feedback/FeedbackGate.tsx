'use client'

// Gate de PLUS pra rotas do Feedback de Cliente.
// Verifica via RPC has_feedback() — grandfather automatico pra contas
// antigas (criadas antes de 2026-06-14 01:00 UTC).
// Quem nao tem acesso ve a tela de upsell com link do combo.

import { useEffect, useState, type ReactNode } from 'react'
import { hasFeedback } from '@/lib/feedback/access'

type Status = 'loading' | 'unlocked' | 'locked'

interface Props {
  children: ReactNode
  checkoutUrl: string
}

export default function FeedbackGate({ children, checkoutUrl }: Props) {
  const [status, setStatus] = useState<Status>('loading')

  const check = () => {
    setStatus('loading')
    hasFeedback().then((ok) => setStatus(ok ? 'unlocked' : 'locked'))
  }
  useEffect(() => { check() }, [])

  if (status === 'unlocked') return <>{children}</>

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="card max-w-md w-full p-6 sm:p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          BarberMeta Plus
        </div>

        {status === 'loading' ? (
          <p className="text-text-muted text-sm font-sans">Verificando seu acesso…</p>
        ) : (
          <>
            <div className="text-5xl mb-3">🔒</div>
            <h2 className="font-serif text-2xl text-text mb-2">Plus: Financeiro + Feedback Premiado</h2>
            <p className="text-text-muted text-sm font-sans leading-relaxed mb-4">
              Desbloqueie de uma vez os 2 módulos premium:
            </p>
            <ul className="text-left text-sm font-sans space-y-2 mb-5 bg-surface-2 rounded-xl p-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span className="text-text"><strong>Controle Financeiro</strong> — caixa, contas a pagar/receber, folha (auto-sync) e fluxo de caixa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span className="text-text"><strong>Feedback Premiado</strong> — link público pra avaliação, brindes sorteados e direcionamento pro Google</span>
              </li>
            </ul>

            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-sm py-3 inline-flex justify-center"
            >
              Desbloquear Plus — R$ 29
            </a>

            <button
              onClick={check}
              className="mt-3 w-full btn-ghost text-sm py-2.5 border border-border"
            >
              Já comprei — atualizar acesso
            </button>

            <p className="text-text-muted text-[11px] font-sans mt-4">
              Pagamento único, sem mensalidade. Após a compra, liberação automática.
              Se você comprou com um e-mail diferente do seu login, fale com o suporte.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
