'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'barbermeta:brindoleta-lancamento-v1'

export default function BrindoletaLaunchModal() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (pathname !== '/dashboard') return
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return
    } catch {
      // Se o navegador bloquear storage, mostra só nesta sessão de página.
    }
    const timer = window.setTimeout(() => setOpen(true), 900)
    return () => window.clearTimeout(timer)
  }, [pathname])

  function dismiss() {
    try { window.localStorage.setItem(STORAGE_KEY, 'seen') } catch { /* sem storage */ }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="brindoleta-launch-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-primary/30 bg-[#12110e] shadow-2xl">
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
              <span className="inline-flex rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#111]">Novidade</span>
              <h2 id="brindoleta-launch-title" className="mt-2 font-serif text-3xl text-white">Conheça a Brindoleta</h2>
            </div>
          </div>

          <p className="text-base leading-relaxed text-[#d6d0c5]">
            Use uma roleta premiada para apresentar serviços extras, produtos e brindes — e acompanhe as vendas de cada colaborador.
          </p>

          <div className="mt-5 flex items-end gap-2">
            <strong className="font-serif text-4xl text-primary">R$ 47</strong>
            <span className="pb-1 text-sm text-[#aaa397]">pagamento único</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/brindoleta" onClick={dismiss} className="btn-primary text-center">
              Conhecer a Brindoleta
            </Link>
            <button type="button" onClick={dismiss} className="btn-ghost border border-white/10 text-center">
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
