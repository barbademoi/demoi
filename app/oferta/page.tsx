import Link from 'next/link'
import type { Metadata } from 'next'
import BrindoletaSpotlight from '@/components/landing/BrindoletaSpotlight'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import Preco from '@/components/landing/Preco'
import Garantia from '@/components/landing/Garantia'
import OfertaTracker from './OfertaTracker'

export const metadata: Metadata = {
  title: 'Assine o BarberMeta — Planos mensal e anual',
  description: 'BarberMeta completo por menos que um corte por mês, com 8 aulas práticas, comunidade, suporte e garantia de 30 dias.',
}

export default function OfertaPage() {
  return (
    <div className="min-h-screen bg-[#07111F] text-white">
      <OfertaTracker />
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#B8C3D1] hover:text-white">← Voltar</Link>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F4B942]">BarberMeta</p>
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#B8C3D1] hover:text-white">Entrar →</Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#F4B942]/15 blur-[110px]" />
          <div className="relative mx-auto max-w-4xl">
            <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">30 dias de garantia total</span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">Por menos que um corte, coloque uma ferramenta de vendas na mão da sua equipe.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:text-lg">Metas, ranking, Brindoleta, campanhas, 8 aulas direto ao ponto, comunidade no WhatsApp e suporte para ajudar você a aplicar.</p>
            <a href="#preco" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-xl bg-[#F4B942] px-7 py-4 text-base font-bold text-[#101828] transition-colors hover:bg-[#FFD16A]">Começar com garantia de 30 dias</a>
            <p className="mt-3 text-sm text-[#8FA0B3]">A partir de R$ 34,90/mês · se não gostar, devolvemos 100%</p>
          </div>
        </section>

        <BrindoletaSpotlight />
        <Garantia />
        <Preco />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
