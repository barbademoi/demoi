'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Venda = { id: string; empresa: string; valorCents: number; quando: string | null }

const SEEN_KEY = 'barbermeta:brindoleta-vendas-vistas'

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function vendaKey(v: Venda) {
  return `${v.id}:${v.quando ?? ''}`
}

export default function BrindoletaAdminAlerta({ vendas }: { vendas: Venda[] }) {
  // Toasts "Hotmart" — só as vendas ainda não vistas (calculado no mount).
  const [toasts, setToasts] = useState<Venda[]>([])

  useEffect(() => {
    let seen: string[] = []
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) seen = parsed.filter((k): k is string => typeof k === 'string')
      }
    } catch { /* localStorage indisponível — segue sem histórico */ }

    const seenSet = new Set(seen)
    const naoVistas = vendas.filter((v) => !seenSet.has(vendaKey(v)))
    // Mostra até as 3 mais recentes que ainda não apareceram.
    setToasts(naoVistas.slice(0, 3))

    // Marca TODAS as vendas atuais como vistas — não reaparecem no próximo load.
    try {
      const todas = vendas.map(vendaKey)
      const atualizado = Array.from(new Set([...seen, ...todas]))
      localStorage.setItem(SEEN_KEY, JSON.stringify(atualizado))
    } catch { /* ignore */ }
    // Só no mount: usa o snapshot de vendas recebido do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss de cada toast depois de ~12s.
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((v) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => vendaKey(t) !== vendaKey(v)))
      }, 12000),
    )
    return () => { timers.forEach(clearTimeout) }
  }, [toasts])

  const dismiss = (v: Venda) =>
    setToasts((prev) => prev.filter((t) => vendaKey(t) !== vendaKey(v)))

  const n = vendas.length
  if (n === 0 && toasts.length === 0) return null

  return (
    <>
      {/* Contador de pendentes — pill fixo canto inferior direito. */}
      {n > 0 && (
        <Link
          href="/admin/brindoleta"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-[#d8ff00]/40 bg-[#11110f] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:brightness-110"
        >
          <span aria-hidden>🔔</span>
          <span>
            <span className="text-[#d8ff00]">{n}</span> venda{n === 1 ? '' : 's'} da Brindoleta aguardando liberação
          </span>
        </Link>
      )}

      {/* Toasts "você fez uma venda!" — pilha no topo. */}
      {toasts.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-3 sm:left-auto sm:right-4 sm:translate-x-0"
        >
          {toasts.map((v) => (
            <div
              key={vendaKey(v)}
              className="relative overflow-hidden rounded-2xl border border-[#ffd149]/40 bg-gradient-to-br from-[#1a2410] via-[#11150e] to-[#241a05] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
            >
              <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#ffd149]/15 blur-2xl" aria-hidden />
              <button
                type="button"
                onClick={() => dismiss(v)}
                aria-label="Fechar aviso"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none" aria-hidden>🎉</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-wide text-[#ffd149]">Você fez uma venda!</p>
                  <p className="mt-1 truncate text-sm text-white">
                    <span className="font-semibold">{v.empresa}</span>
                    <span className="text-white/50"> · </span>
                    <span className="font-bold text-[#d8ff00]">{money(v.valorCents)}</span>
                  </p>
                  <Link
                    href="/admin/brindoleta"
                    onClick={() => dismiss(v)}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#d8ff00] px-3 py-2 text-xs font-black text-[#11110f] transition hover:brightness-105"
                  >
                    Liberar agora →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
