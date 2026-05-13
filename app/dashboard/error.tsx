'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard] rendering error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <h1 className="font-serif text-3xl text-text">Algo deu errado</h1>
        <p className="text-text-muted text-sm font-sans">
          Ocorreu um erro ao carregar o dashboard.
          {error.digest && (
            <span className="block mt-1 text-xs text-text-muted/60">
              Código: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary text-sm"
          >
            Tentar novamente
          </button>
          <a href="/login" className="btn-secondary text-sm">
            Voltar ao login
          </a>
        </div>
      </div>
    </main>
  )
}
