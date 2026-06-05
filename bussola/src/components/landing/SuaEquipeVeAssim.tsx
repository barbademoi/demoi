'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

// Mostra a perspectiva da equipe: o que cada colaborador vê no link
// próprio dele. Padding generoso pra respirar entre a seção das
// Features (que tem stack diagonal alto) e o Case Demôi.
export function SuaEquipeVeAssim() {
  return (
    <section className="px-4 py-20 md:py-24 bg-linho/30 border-y border-border">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-wider text-marrom font-semibold"
        >
          E sua equipe?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          Sua equipe vê assim no celular dela.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-grafite"
        >
          Sem app, sem login, sem complicação. Cada pessoa recebe um link único
          e acompanha tudo pelo celular.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-[320px] mx-auto pt-4"
        >
          <PhoneFrame size="md">
            <LazyAutoplayVideo
              src="tela-do-colaborador"
              poster="/landing/optimized/tela-do-colaborador-poster.jpg"
            />
          </PhoneFrame>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-grafite"
        >
          Anotação, brinde sorteado, confirmação de leitura. Tudo num link.
        </motion.p>
      </div>
    </section>
  )
}
