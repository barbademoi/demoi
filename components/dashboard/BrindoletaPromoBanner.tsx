import Link from 'next/link'
import type { BrindoletaStatus } from '@/lib/brindoleta/config'

export default function BrindoletaPromoBanner({ status }: { status: BrindoletaStatus | null }) {
  if (status && status !== 'rejected') return null

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-[#d8ff00]/30 bg-[#11120e] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.2)] sm:p-5">
      <div className="absolute -right-16 -top-20 -z-10 h-52 w-52 rounded-full bg-[#d8ff00]/10 blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[#2b2921] bg-[conic-gradient(#d8ff00_0_60deg,#ff6045_60deg_120deg,#ffd149_120deg_180deg,#35b7eb_180deg_240deg,#9365ed_240deg_300deg,#f44696_300deg_360deg)] shadow-lg">
            <span className="h-5 w-5 rounded-full border-2 border-white bg-[#111]" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d8ff00]">Brindoleta</span>
            <h2 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">Venda mais em cada atendimento</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Roleta de ofertas com acompanhamento por colaborador · pagamento único de R$ 47.</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Link href="/dashboard/brindoleta#demonstracao" className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-xs font-bold text-white hover:bg-white/10">
            Ver demonstração
          </Link>
          <Link href="/dashboard/brindoleta#comprar" className="rounded-xl bg-[#d8ff00] px-3 py-2.5 text-center text-xs font-black text-[#11110f] hover:brightness-105">
            Comprar por R$ 47
          </Link>
        </div>
      </div>
    </section>
  )
}
