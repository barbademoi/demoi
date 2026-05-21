'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Trocou em jun/26: forçar exibição mesmo pra quem já fechou o aviso anterior.
const STORAGE_KEY = 'aviso-mudanca-lancamento-2026-05'

export default function AvisoSimplificacao() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) !== '1') {
      setVisivel(true)
    }
  }, [])

  function fechar() {
    setVisivel(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // localStorage indisponível (private mode), tudo bem
    }
  }

  if (!visivel) return null

  return (
    <div className="mx-4 lg:mx-6 mt-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-2xl leading-none mt-0.5 shrink-0">📢</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-text font-semibold text-base sm:text-lg font-sans leading-tight">
                Atualização importante: a forma de lançar mudou
              </p>
              <button
                onClick={fechar}
                aria-label="Fechar aviso"
                className="text-text-muted hover:text-text transition-colors shrink-0 -mt-1 -mr-1 p-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="text-text-muted text-sm font-sans leading-relaxed mb-3">
              Agora tudo acontece na nova aba <strong className="text-text">Lançamento diário</strong> (menu lateral).
              O ✏️ no card do barbeiro foi removido pra evitar confusão.
            </p>

            <ul className="text-text-muted text-sm font-sans space-y-1.5 mb-4 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>Lance <strong className="text-text">dia a dia</strong>: comissão e atendimentos somam no mês automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>Comprou <strong className="text-text">no meio do mês</strong>? Tem botão pra definir o saldo acumulado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span><strong className="text-text">Novidade:</strong> ticket médio (faturamento ÷ atendimentos) — aparece quando preencher os atendimentos</span>
              </li>
            </ul>

            <p className="text-text-muted text-xs font-sans italic mb-3">
              A aula antiga vai ser regravada em breve com o novo fluxo. Dúvidas, fala com a gente no grupo da comunidade.
            </p>

            <Link
              href="/dashboard/lancamento-diario"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold font-sans hover:bg-primary/90 transition-colors"
            >
              Ir pro Lançamento diário →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
