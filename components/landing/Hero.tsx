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
            <motion.h1
              custom={0} variants={fadeUp} initial="hidden" animate="show"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
            >
              O sistema que transforma sua barbearia numa{' '}
              <span className="text-[#D4A85A]">gincana de vendas</span>.
            </motion.h1>

            <motion.p
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 text-[#A0AEC0] text-lg leading-relaxed"
            >
              Cada barbeiro acompanha o próprio resultado pelo celular —
              comissão acumulada, ranking ao vivo e quanto falta pra cada meta.
              <strong className="text-white"> Quem está atrás, acelera sozinho.</strong>
            </motion.p>

            <motion.div
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="mt-6"
            >
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm font-semibold text-white">
                  <span className="text-base">👥</span>
                  Funciona com <span className="text-[#D4A85A]">equipe</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm font-semibold text-white">
                  <span className="text-base">✂️</span>
                  Funciona <span className="text-[#D4A85A]">sozinho</span>
                </span>
              </div>
              <p className="mt-2 text-[#A0AEC0] text-xs sm:text-sm leading-relaxed text-center lg:text-left">
                Você escolhe o modo na primeira vez que entrar — o sistema se adapta ao seu caso.
              </p>
            </motion.div>

            {/* destaque link individual */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D4A85A]/10 border border-[#D4A85A]/25 px-4 py-2.5 text-sm text-[#D4A85A]"
            >
              <span>🔗</span>
              <span>Cada barbeiro tem seu link único — sem senha, sem app</span>
            </motion.div>

            {/* destaque aulas inclusas */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-3 inline-flex items-start gap-2.5 rounded-xl bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-4 py-3 text-sm text-left max-w-md"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">🎥</span>
              <span className="text-[#E6CB8A] leading-relaxed">
                <span className="font-bold text-white">+6 aulas curtas comigo</span> ensinando 2 tipos
                de metas e gamificação — exatamente o que faço aqui na minha barbearia.
              </span>
            </motion.div>

            <motion.div
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <CTAButton />
                <a
                  href="#funcionalidades"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                >
                  Ver funcionalidades
                  <span aria-hidden>↓</span>
                </a>
              </div>
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
            </motion.div>
          </div>

          {/* ── mockup desktop + celular ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative w-full max-w-[520px] pb-16 sm:pb-20">
              {/* glow dourado por trás */}
              <div aria-hidden className="absolute -inset-6 rounded-3xl blur-3xl opacity-20 bg-[#D4A85A]" />

              {/* Desktop — janela com chrome de browser */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl">
                <div className="bg-[#161820] h-7 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="mx-auto rounded-md bg-[#0A1929] border border-white/10 px-2 py-0.5 text-[10px] text-[#A0AEC0] font-mono">
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

              {/* Mobile — celular sobrepondo no canto inferior direito */}
              <div className="absolute -bottom-2 -right-2 sm:-right-4 w-[34%] sm:w-[30%] max-w-[180px]">
                <div className="relative rounded-[28px] border-[5px] border-[#0F1117] bg-[#0F1117] shadow-2xl overflow-hidden">
                  {/* notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#0F1117] rounded-b-2xl z-10" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/prints/03-barbeiro-individual.png"
                    alt="Link individual do barbeiro no celular"
                    className="block w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── trust strip ── */}
        <motion.div
          custom={5} variants={fadeUp} initial="hidden" animate="show"
          className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-[#A0AEC0] text-sm"
        >
          <span>🏠</span>
          <span>Usado pela <strong className="text-white">Demôi Barbearia</strong> · Cássia / MG · 7 barbeiros</span>
        </motion.div>
      </div>
    </section>
  )
}
