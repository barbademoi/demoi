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

          {/* ── texto + CTA + autoridade do Carlos ── */}
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

            {/* avatar Carlos como credencial — discreto, abaixo da headline */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] pl-1.5 pr-4 py-1.5"
            >
              <span className="block w-9 h-9 rounded-full overflow-hidden border border-[#D4A85A]/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/carlos-hero.jpg"
                  alt=""
                  className="block w-full h-full object-cover"
                />
              </span>
              <span className="text-left">
                <span className="block text-white text-xs sm:text-sm font-semibold leading-tight">
                  Por Carlos Henrique
                </span>
                <span className="block text-[#A0AEC0] text-[11px] sm:text-xs leading-tight">
                  criador do BarberMeta · dono da Demôi Barbearia
                </span>
              </span>
            </motion.div>

            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
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
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left max-w-md"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">ℹ️</span>
              <span className="text-[#A0AEC0] text-sm leading-relaxed">
                <span className="text-white font-semibold">Não precisa trocar seu sistema de gestão.</span>{' '}
                BarberMeta é um <span className="text-emerald-300 font-semibold">adicional</span> — se integra ao que você já usa (Trinks, Booksy, Agenda Serviço, etc).
              </span>
            </motion.div>
          </div>

          {/* ── mockup grande do dashboard, lado direito (sem sobreposicao) ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 relative w-full flex justify-center items-center"
          >
            {/* glow dourado por tras */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-25 bg-[#D4A85A]" />
            </div>

            {/* Browser mockup — dashboard ocupando o espaco todo */}
            <div className="relative z-10 w-full max-w-[520px]">
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl shadow-black/60">
                {/* chrome de browser */}
                <div className="bg-[#161820] h-8 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="mx-auto rounded-md bg-[#0A1929] border border-white/10 px-2 py-0.5 text-[10px] text-[#A0AEC0] font-mono truncate max-w-[60%]">
                    barbermeta.com.br/dashboard
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/dashboard-meta-coletiva.png"
                  alt="Dashboard do BarberMeta com Meta Coletiva, progresso e ritmo necessário"
                  className="block w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
