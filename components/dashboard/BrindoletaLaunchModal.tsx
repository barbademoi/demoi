'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BrindoletaStatus } from '@/lib/brindoleta/config'

const STORAGE_KEY = 'barbermeta:brindoleta-lancamento-v2'
const DAY_MS = 24 * 60 * 60 * 1000

type LaunchState = {
  impressions: number
  lastShownAt: string
}

function promotionAllowed(status: BrindoletaStatus | null | undefined) {
  return status == null || status === 'rejected'
}

function readState(): LaunchState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LaunchState>
    if (!parsed.lastShownAt || !Number.isFinite(parsed.impressions)) return null
    return {
      impressions: Math.max(0, Math.min(3, Number(parsed.impressions))),
      lastShownAt: parsed.lastShownAt,
    }
  } catch {
    return null
  }
}

function waitDaysFor(impressions: number) {
  if (impressions >= 3) return 30
  if (impressions === 2) return 7
  return 3
}

export default function BrindoletaLaunchModal({ status }: { status?: BrindoletaStatus | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (pathname !== '/dashboard' || status === undefined || !promotionAllowed(status)) return

    const state = readState()
    const now = Date.now()
    const lastShown = state ? Date.parse(state.lastShownAt) : Number.NaN
    const elapsed = Number.isFinite(lastShown) ? now - lastShown : Number.POSITIVE_INFINITY
    const waitDays = state ? waitDaysFor(state.impressions) : 0
    if (state && elapsed < waitDays * DAY_MS) return

    const timer = window.setTimeout(() => {
      const restartingCycle = !!state && state.impressions >= 3
      const impressions = restartingCycle ? 1 : Math.min((state?.impressions ?? 0) + 1, 3)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          impressions,
          lastShownAt: new Date().toISOString(),
        } satisfies LaunchState))
      } catch {
        // Se o navegador bloquear storage, a campanha continua funcional nesta visita.
      }
      setOpen(true)
    }, 1100)

    return () => window.clearTimeout(timer)
  }, [pathname, status])

  function dismiss() {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="brindoleta-launch-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#d8ff00]/30 bg-[#12110e] shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar novidade"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-xl text-white hover:bg-black/60"
        >
          ×
        </button>

        <div className="bg-[radial-gradient(circle_at_top_right,rgba(216,255,0,0.22),transparent_45%),linear-gradient(145deg,#171611,#0d0c0a)] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[6px] border-[#2b2921] bg-[conic-gradient(#d8ff00_0_60deg,#ff5d42_60deg_120deg,#ffd149_120deg_180deg,#35b7eb_180deg_240deg,#9365ed_240deg_300deg,#f44696_300deg_360deg)] shadow-xl">
              <span className="h-7 w-7 rounded-full border-2 border-white bg-[#111]" />
            </div>
            <div>
              <span className="inline-flex rounded-full bg-[#d8ff00] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#111]">Novidade</span>
              <h2 id="brindoleta-launch-title" className="mt-2 font-serif text-3xl text-white">Venda mais em cada atendimento</h2>
            </div>
          </div>

          <p className="text-base leading-relaxed text-[#d6d0c5]">
            A Brindoleta ajuda sua equipe a apresentar serviços extras, produtos e brindes — e mostra quem gerou cada venda.
          </p>

          <div className="mt-5 flex items-end gap-2">
            <strong className="font-serif text-4xl text-[#d8ff00]">R$ 47</strong>
            <span className="pb-1 text-sm text-[#aaa397]">pagamento único</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/brindoleta#demonstracao" onClick={dismiss} className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-white/10">
              Ver como funciona
            </Link>
            <Link href="/dashboard/brindoleta#comprar" onClick={dismiss} className="rounded-xl bg-[#d8ff00] px-4 py-3 text-center text-sm font-black text-[#11110f] transition-transform hover:scale-[1.01]">
              Comprar por R$ 47
            </Link>
          </div>
          <button type="button" onClick={dismiss} className="mt-4 w-full text-center text-xs font-semibold text-[#aaa397] hover:text-white">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
