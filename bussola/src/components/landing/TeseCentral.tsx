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

      <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 mt-14">
        {PILARES.map((p, i) => (
          <Pilar key={p.titulo} {...p} delay={i * 0.2} />
        ))}
      </div>

      {/* Árvore + frase de fechamento juntas (ancora visual e textual) */}
      <div className="mt-16 grid sm:grid-cols-[180px_1fr] gap-6 sm:gap-8 items-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
          className="flex justify-center sm:justify-end"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/arvore-cultura.svg"
            alt="Cultura como raízes profundas que sustentam o crescimento"
            className="w-32 h-32 sm:w-44 sm:h-44"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-serif text-xl sm:text-2xl text-marrom leading-snug text-center sm:text-left"
        >
          E cultura não se constrói em planilha. Se constrói na conversa semanal com a equipe — com a IA da Bússola te guiando.
        </motion.p>
      </div>
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
