'use client'

import { motion } from 'framer-motion'

interface Props {
  barbearias: number
  barbeiros: number
}

export default function PlatformStats({ barbearias, barbeiros }: Props) {
  return (
    <section className="bg-[#0A1929] py-8 sm:py-10 px-4 border-y border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
      >
        <div className="text-center">
          <p className="text-3xl sm:text-4xl font-bold text-[#D4A85A] tabular-nums">
            +{barbearias}
          </p>
          <p className="text-xs sm:text-sm text-white/60 font-medium mt-1 tracking-wide">
            {barbearias === 1 ? 'barbearia confiando' : 'barbearias confiando'}
          </p>
        </div>

        <div className="hidden sm:block w-px h-12 bg-white/10" />

        <div className="text-center">
          <p className="text-3xl sm:text-4xl font-bold text-[#D4A85A] tabular-nums">
            +{barbeiros}
          </p>
          <p className="text-xs sm:text-sm text-white/60 font-medium mt-1 tracking-wide">
            {barbeiros === 1 ? 'barbeiro batendo metas' : 'barbeiros batendo metas'}
          </p>
        </div>
      </motion.div>
    </section>
  )
}
