'use client'

import { motion } from 'framer-motion'

const PARAGRAFOS = [
  'Você sai da reunião sem saber se foi produtiva ou não.',
  'Cobra alguém e fica em dúvida se foi duro demais — ou se foi mole demais.',
  'Quer elogiar, mas trava porque parece bajulação.',
  'Sente que sua equipe poderia render mais, mas não sabe exatamente o que precisa mudar.',
  'E entre atender cliente, pagar conta e resolver problema, nunca sobra tempo pra ler livro de gestão.',
]

export function Dor() {
  return (
    <section className="px-4 py-20 max-w-3xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6 }}
        className="font-serif text-3xl sm:text-4xl text-preto text-center leading-tight"
      >
        Mas conduzir essa conversa dá um trabalho que ninguém te ensinou.
      </motion.h2>

      <div className="mt-10 space-y-5 text-grafite text-lg leading-relaxed">
        {PARAGRAFOS.map((texto, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            {texto}
          </motion.p>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-12 font-serif text-2xl sm:text-3xl text-marrom text-center leading-snug"
      >
        A Bússola foi feita pra resolver isso — construindo cultura na sua reunião
        semanal, mesmo quando você nunca teve tempo de estudar liderança.
      </motion.p>
    </section>
  )
}
