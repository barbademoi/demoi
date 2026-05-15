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
              Metas claras.{' '}
              <span className="text-[#D4A85A]">Equipe motivada.</span>{' '}
              Sem cobrar.
            </motion.h1>

            <motion.p
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 text-[#A0AEC0] text-lg leading-relaxed"
            >
              Cada barbeiro acompanha o próprio resultado pelo celular —
              comissão acumulada, posição no ranking e quanto falta pra cada meta.
              Quem está atrás, acelera sozinho.
            </motion.p>

            {/* destaque link individual */}
            <motion.div
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D4A85A]/10 border border-[#D4A85A]/25 px-4 py-2.5 text-sm text-[#D4A85A]"
            >
              <span>🔗</span>
              <span>Cada barbeiro tem seu link único — sem senha, sem app</span>
            </motion.div>

            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <CTAButton />
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
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
                alt="Carlos Henrique — dono da Demôi Barbearia"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
            <p className="text-[#A0AEC0] text-xs text-center">
              Funciona no celular, computador ou tablet — de onde você estiver
            </p>
          </motion.div>
        </div>

        {/* ── trust strip ── */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="show"
          className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-[#A0AEC0] text-sm"
        >
          <span>🏠</span>
          <span>Usado pela <strong className="text-white">Demôi Barbearia</strong> · Cássia / MG · 7 barbeiros</span>
        </motion.div>
      </div>
    </section>
  )
}
