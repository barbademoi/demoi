'use client'

import { motion, type Variants } from 'framer-motion'
import CTAButton from './CTAButton'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.11, ease: 'easeOut' },
  }),
}

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0A1929] flex items-center pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── texto ── */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* badge cima */}
            <motion.span
              custom={0} variants={fadeUp} initial="hidden" animate="show"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-3 py-1 text-xs font-bold text-[#D4A85A] uppercase tracking-wider mb-5"
            >
              <span>🎯</span>
              Sistema + 6 aulas
            </motion.span>

            <motion.h1
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
            >
              O sistema <span className="text-[#D4A85A]">+ 6 aulas</span> pra você criar, rodar e acompanhar a{' '}
              <span className="text-[#D4A85A]">gincana</span> que aumenta o faturamento da sua barbearia.
            </motion.h1>

            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 text-[#A0AEC0] text-base sm:text-lg leading-relaxed"
            >
              Você não recebe só a ferramenta. Recebe o{' '}
              <span className="text-white font-semibold">passo a passo de quem já faz</span>:
              como montar as metas, engajar o time e transformar disputa em faturamento.
            </motion.p>

            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
              </div>
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
            </motion.div>

            {/* aviso: nao substitui sistema de gestao */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left max-w-md"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">ℹ️</span>
              <span className="text-[#A0AEC0] text-sm leading-relaxed">
                <span className="text-white font-semibold">Não precisa trocar seu sistema de gestão.</span>{' '}
                BarberMeta é um <span className="text-emerald-300 font-semibold">adicional</span> — se integra ao que você já usa (Trinks, Booksy, Agenda Serviço, etc).
              </span>
            </motion.div>
          </div>

          {/* ── foto ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 flex flex-col items-center gap-3"
          >
            <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
              <div aria-hidden className="absolute -inset-4 rounded-3xl blur-2xl opacity-15 bg-[#D4A85A]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/foto-celular.png"
                alt="Carlos Henrique usando o BarberMeta no celular"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
