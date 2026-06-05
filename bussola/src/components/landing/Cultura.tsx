'use client'

import { motion } from 'framer-motion'

export function Cultura() {
  return (
    <section className="px-4 py-20 max-w-2xl mx-auto text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7 }}
        className="flex justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/arvore-cultura.svg"
          alt=""
          aria-hidden
          className="w-40 h-40 sm:w-52 sm:h-52"
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
      >
        Empresa só cresce se a cultura for forte.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="text-grafite text-lg leading-relaxed"
      >
        Cultura é o que faz sua equipe trabalhar bem quando você não está
        olhando. E cultura se constrói na conversa semanal — com a IA da
        Bússola te guiando.
      </motion.p>
    </section>
  )
}
