'use client'

import { motion } from 'framer-motion'

const PILARES = [
  {
    svg: '/illustrations/constelacao-direcao.svg',
    titulo: 'Cultura é direção',
    texto:
      'Quando a equipe sabe pra onde vai, decide melhor sozinha. Não precisa te perguntar tudo.',
  },
  {
    svg: '/illustrations/pessoas-confianca.svg',
    titulo: 'Cultura é confiança',
    texto:
      'Quando a equipe confia em você e entre si, problema vira conversa em vez de virar fofoca.',
  },
  {
    svg: '/illustrations/crescimento.svg',
    titulo: 'Cultura é crescimento',
    texto:
      'Empresa com cultura forte cresce sem precisar do dono apagando incêndio o tempo todo.',
  },
]

export function TeseCentral() {
  return (
    <section className="px-4 py-20 max-w-5xl mx-auto">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
          className="font-serif text-3xl sm:text-5xl text-preto leading-tight"
        >
          O que sustenta uma empresa não é planilha. É cultura.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-grafite text-lg leading-relaxed"
        >
          Toda empresa que cresceu de verdade tem uma coisa em comum: cultura
          forte. Não importa se é uma barbearia, um restaurante ou uma agência.
          Cultura é o que faz a equipe trabalhar bem quando você não está olhando.
        </motion.p>
      </div>

      {/* Árvore-metáfora central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex justify-center my-12"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/arvore-cultura.svg"
          alt="Cultura como raízes profundas que sustentam o crescimento"
          className="w-56 h-56 sm:w-72 sm:h-72"
        />
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 mt-4">
        {PILARES.map((p, i) => (
          <Pilar key={p.titulo} {...p} delay={i * 0.2} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-16 font-serif text-2xl sm:text-3xl text-marrom text-center leading-snug max-w-3xl mx-auto"
      >
        E cultura não se constrói em planilha. Se constrói na conversa semanal com a equipe — com a IA da Bússola te guiando.
      </motion.p>
    </section>
  )
}

function Pilar({ svg, titulo, texto, delay }: { svg: string; titulo: string; texto: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="text-center space-y-3"
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
        className="inline-flex w-28 h-28 items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svg} alt="" aria-hidden className="w-full h-full" />
      </motion.div>
      <h3 className="font-semibold text-text text-lg">{titulo}</h3>
      <p className="text-sm text-grafite leading-relaxed max-w-xs mx-auto">{texto}</p>
    </motion.div>
  )
}
