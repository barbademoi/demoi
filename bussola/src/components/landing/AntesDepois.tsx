'use client'

import { motion } from 'framer-motion'
import { XCircle, CheckCircle2 } from 'lucide-react'

const ANTES = [
  'Reunião improvisada na sexta-feira',
  'Você esquece o que aconteceu na semana',
  'Elogios soam genéricos ou bajulação',
  'Cobranças saem do nada e geram defensiva',
  'Cultura é um ideal, não uma prática',
  'Você sai da reunião sem saber se foi boa',
]

const DEPOIS = [
  'Pauta pronta antes da reunião começar',
  'IA lembra de cada observação da semana',
  'Elogios específicos, com fundamento',
  'Conversas difíceis com firmeza e respeito',
  'Cultura construída semana após semana',
  'Reunião termina com direção clara pra todos',
]

export function AntesDepois() {
  return (
    <section className="px-4 py-20 bg-surface border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
          >
            O que muda quando a Bússola entra na sua semana.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-grafite"
          >
            Veja a diferença na prática.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Antes */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-border bg-background p-6 space-y-4"
          >
            <p className="text-[10px] uppercase tracking-wider text-chumbo font-semibold">
              Sem a Bússola
            </p>
            <ul className="space-y-3">
              {ANTES.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-5%' }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-2 text-sm text-chumbo"
                >
                  <XCircle size={18} strokeWidth={1.5} className="shrink-0 mt-0.5 text-chumbo/60" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Depois */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-lg border-2 border-marrom bg-linho/60 p-6 space-y-4 shadow-md"
          >
            <p className="text-[10px] uppercase tracking-wider text-marrom font-semibold">
              Com a Bússola
            </p>
            <ul className="space-y-3">
              {DEPOIS.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-5%' }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
                  className="flex items-start gap-2 text-sm text-text"
                >
                  <CheckCircle2 size={18} strokeWidth={1.8} className="shrink-0 mt-0.5 text-marrom" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
