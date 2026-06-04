'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

const PASSOS = [
  {
    numero: '01',
    titulo: 'Anote no momento',
    texto:
      'Viu algo importante na semana? Abre o celular, anota em segundos. Sem categoria, sem complicação.',
    video: 'colaboradores',
  },
  {
    numero: '02',
    titulo: 'A IA organiza',
    texto:
      'No dia da reunião, sua pauta aparece pronta. Cada observação no lugar certo, com sugestão de como abordar com firmeza e respeito.',
    video: 'dashboard-gestor',
  },
  {
    numero: '03',
    titulo: 'Você conduz',
    texto:
      'Segue os 6 momentos da Bússola no celular. Equipe entende, você lidera com clareza, todo mundo sai sabendo o que fazer — e como faz parte de algo maior.',
    video: 'modo-reuniao',
  },
]

export function ComoFunciona() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6 }}
        className="font-serif text-3xl sm:text-4xl text-preto text-center mb-12 leading-tight"
      >
        Três passos. Uma cultura que se constrói.
      </motion.h2>

      <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
        {PASSOS.map((passo, i) => (
          <motion.div
            key={passo.numero}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            whileHover={{ y: -4 }}
            className="space-y-4 card p-5 transition-shadow hover:shadow-md"
          >
            <PhoneFrame size="sm">
              <LazyAutoplayVideo
                src={passo.video}
                poster={`/landing/optimized/${passo.video}-poster.jpg`}
              />
            </PhoneFrame>
            <p className="font-serif text-5xl text-marrom font-bold leading-none">{passo.numero}</p>
            <h3 className="font-semibold text-text text-lg">{passo.titulo}</h3>
            <p className="text-sm text-grafite leading-relaxed">{passo.texto}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center text-grafite text-lg mt-12 italic"
      >
        Reunião pronta em 30 minutos. Sem decorar, sem adivinhar. Cultura construída na conversa.
      </motion.p>
    </section>
  )
}
