'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AguardandoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const externalRef = searchParams.get('external_reference') ?? ''
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 3), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!externalRef) return
    const poll = setInterval(async () => {
      const res = await fetch(`/api/compra-status?ref=${externalRef}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'approved') {
          router.replace(`/boas-vindas?external_reference=${externalRef}`)
        }
      }
    }, 10_000)
    return () => clearInterval(poll)
  }, [externalRef, router])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-text mb-1">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
        </div>

        <div className="card p-8 space-y-5">
          <div className="text-4xl">⏳</div>

          <div>
            <h2 className="font-serif text-xl text-text mb-2">
              Aguardando confirmação
            </h2>
            <p className="text-text-muted text-sm font-sans leading-relaxed">
              Seu pagamento está sendo processado. Esta página atualiza
              automaticamente assim que confirmado.
            </p>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  dots === i ? 'bg-primary' : 'bg-surface-2'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-text-muted font-sans">
          Dúvidas?{' '}
          <a
            href="mailto:suporte@barbermeta.com.br"
            className="text-primary hover:text-white transition-colors"
          >
            suporte@barbermeta.com.br
          </a>
        </p>
      </div>
    </main>
  )
}

export default function AguardandoPage() {
  return (
    <Suspense>
      <AguardandoContent />
    </Suspense>
  )
}
