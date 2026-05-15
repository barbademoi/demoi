'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import CTAButton from './CTAButton'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: 'easeOut' },
  }),
}

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0A1929] flex items-center pt-16">
      {/* subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

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
              className="mt-6 text-[#A0AEC0] text-lg sm:text-xl leading-relaxed"
            >
              Sistema feito por dono de barbearia que cansou de mandar meta
              por texto no WhatsApp. Cada barbeiro vê o próprio ranking.
              Quem está atrás, acelera sozinho.
            </motion.p>

            <motion.div
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="mt-8 flex flex-col items-center lg:items-start gap-3"
            >
              <CTAButton />
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
            </motion.div>
          </div>

          {/* ── mockup ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative w-full max-w-[340px] sm:max-w-[400px]">
              {/* glow */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-20 bg-[#D4A85A]"
              />
              <div className="relative rounded-2xl border border-[#D4A85A]/40 overflow-hidden shadow-2xl">
                <Image
                  src="/prints/03-mobile-view.png"
                  alt="Dashboard BarberMeta — meta coletiva e ranking"
                  width={400}
                  height={720}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── trust strip ── */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="mt-16 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-[#A0AEC0] text-sm"
        >
          <span className="text-base">🏠</span>
          <span>Usado pela <strong className="text-white">Demôi Barbearia</strong> · Cássia / MG</span>
        </motion.div>
      </div>
    </section>
  )
}
