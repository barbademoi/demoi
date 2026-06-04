'use client'

import { motion } from 'framer-motion'
import { Compass, Users, TrendingUp, type LucideIcon } from 'lucide-react'

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
        <Pilar
          icon={Compass}
          titulo="Cultura é direção"
          texto="Quando a equipe sabe pra onde vai, decide melhor sozinha. Não precisa te perguntar tudo."
          delay={0}
        />
        <Pilar
          icon={Users}
          titulo="Cultura é confiança"
          texto="Quando a equipe confia em você e entre si, problema vira conversa em vez de virar fofoca."
          delay={0.2}
        />
        <Pilar
          icon={TrendingUp}
          titulo="Cultura é crescimento"
          texto="Empresa com cultura forte cresce sem precisar do dono apagando incêndio o tempo todo."
          delay={0.4}
        />
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

function Pilar({ icon: Icon, titulo, texto, delay }: { icon: LucideIcon; titulo: string; texto: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="text-center space-y-3"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
        className="inline-flex w-14 h-14 rounded-full bg-linho items-center justify-center"
      >
        <Icon size={28} strokeWidth={1.5} className="text-marrom" />
      </motion.div>
      <h3 className="font-semibold text-text text-lg">{titulo}</h3>
      <p className="text-sm text-grafite leading-relaxed max-w-xs mx-auto">{texto}</p>
    </motion.div>
  )
}
