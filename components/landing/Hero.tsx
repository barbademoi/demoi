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

          {/* ── montagem: foto + logo + mockups do sistema ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 relative w-full flex justify-center items-center min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]"
          >
            {/* glow dourado por tras de tudo */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 bg-[#D4A85A]" />
            </div>

            {/* Foto do Carlos — principal, centro */}
            <div className="relative z-20 w-[58%] max-w-[280px] sm:max-w-[320px]">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/carlos-oculos-vermelho.jpg"
                  alt="Carlos Henrique, criador do BarberMeta"
                  className="block w-full h-auto"
                />
                {/* gradiente embaixo pra leitura do nome */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A1929]/95 via-[#0A1929]/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-bold text-sm sm:text-base leading-tight">Carlos Henrique</p>
                  <p className="text-[#D4A85A] text-[11px] sm:text-xs font-semibold">criador do BarberMeta</p>
                </div>
              </div>
            </div>

            {/* Logo BarberMeta — flutuando topo direito */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
              className="absolute z-30 top-2 right-2 sm:top-4 sm:right-6 lg:top-0 lg:right-2"
            >
              <div className="rounded-2xl border border-[#D4A85A]/40 bg-[#0A1929]/95 backdrop-blur-md shadow-2xl shadow-[#D4A85A]/20 p-2.5 sm:p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-barbermeta.png"
                  alt="Logo BarberMeta"
                  className="block w-14 h-14 sm:w-20 sm:h-20 rounded-xl"
                />
              </div>
            </motion.div>

            {/* Mockup desktop — flutuando esquerda atras */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -6 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="absolute z-10 top-6 sm:top-10 lg:top-14 -left-2 sm:left-0 lg:-left-4 w-[44%] max-w-[200px] sm:max-w-[230px]"
            >
              <div className="rounded-lg overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl shadow-black/60">
                <div className="bg-[#161820] h-4 sm:h-5 flex items-center px-1.5 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#28C840]" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/dashboard-meta-coletiva.png"
                  alt="Dashboard do BarberMeta"
                  className="block w-full h-auto"
                />
              </div>
            </motion.div>

            {/* Mockup phone — flutuando direita baixo */}
            <motion.div
              initial={{ opacity: 0, x: 30, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 5 }}
              transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
              className="absolute z-30 bottom-2 sm:bottom-6 -right-1 sm:right-2 lg:-right-2 w-[32%] max-w-[130px] sm:max-w-[150px]"
            >
              <div className="relative rounded-2xl border-[4px] border-[#0F1117] bg-[#0F1117] shadow-2xl shadow-black/60 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-2 bg-[#0F1117] rounded-b-xl z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/03-barbeiro-individual.png"
                  alt="Link individual do barbeiro"
                  className="block w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
