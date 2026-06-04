'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

export function ProvaSocial() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section className="px-4 py-16 bg-surface border-y border-border overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
          >
            Em uso numa barbearia com 11 pessoas e mais de 1.700 atendimentos por mês.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-grafite"
          >
            A Bússola não nasceu numa startup. Nasceu na Demôi Barbearia, em
            Cássia/MG, onde 11 pessoas atendem mais de 1.700 clientes todo mês.
            Foi testada por meses na operação real antes de chegar até você.
          </motion.p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat numero={<AnimatedNumber to={11} />} label="pessoas na equipe" delay={0} />
          <Stat numero={<><AnimatedNumber to={1700} />+</>} label="atendimentos por mês" delay={0.15} />
          <Stat numero={<><AnimatedNumber to={5.0} decimals={1} duration={1200} />★</>} label="média dos clientes" delay={0.3} />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-grafite max-w-2xl mx-auto"
        >
          Mais de uma centena de feedbacks coletados — internos e no Google. Mas o
          que importa não são os números. É o que está por trás deles: a cultura.
        </motion.p>

        {/* TODO: substituir por foto estática da fachada quando enviada */}
        <motion.div ref={ref} style={{ y }} className="max-w-3xl mx-auto pt-4">
          <div className="rounded-lg overflow-hidden border border-border shadow-md aspect-video bg-areia">
            <LazyAutoplayVideo
              src="fachada-demoi"
              poster="/landing/optimized/fachada-demoi-poster.jpg"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Stat({ numero, label, delay }: { numero: React.ReactNode; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <p className="font-serif text-3xl sm:text-5xl text-marrom font-bold leading-none">{numero}</p>
      <p className="text-xs sm:text-sm text-chumbo mt-1.5">{label}</p>
    </motion.div>
  )
}
