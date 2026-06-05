'use client'

import { motion } from 'framer-motion'
import { PenLine, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'
import { PreparaReuniaoMock } from './mocks/PreparaReuniaoMock'

interface Feature {
  icon: LucideIcon
  titulo: string
  descricao: string
  midia: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    icon: PenLine,
    titulo: 'Você anota em segundos',
    descricao: 'Texto livre no celular. Sem categoria, sem complicação. A IA cuida do resto.',
    midia: (
      <LazyAutoplayVideo
        src="colaboradores"
        poster="/landing/optimized/colaboradores-poster.jpg"
      />
    ),
  },
  {
    icon: Sparkles,
    titulo: 'A IA organiza tudo',
    descricao: 'No dia da reunião, sua pauta aparece pronta com princípios de liderança aplicados.',
    midia: <PreparaReuniaoMock />,
  },
  {
    icon: Users,
    titulo: 'Você conduz com clareza',
    descricao: 'Modo Reunião guia você nos 6 momentos. Equipe entende. Cultura se constrói.',
    midia: (
      <LazyAutoplayVideo
        src="modo-reuniao"
        poster="/landing/optimized/modo-reuniao-poster.jpg"
      />
    ),
  },
]

export function Features() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12 space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          O que a Bússola faz pra você.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-grafite"
        >
          Três coisas. Sem complicação.
        </motion.p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
        {FEATURES.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.titulo}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="card p-5 space-y-4 transition-shadow hover:shadow-md"
            >
              <Icon size={60} strokeWidth={1.4} className="text-marrom" />
              <h3 className="font-semibold text-text text-lg">{f.titulo}</h3>
              <p className="text-sm text-grafite leading-relaxed">{f.descricao}</p>
              <PhoneFrame size="sm">{f.midia}</PhoneFrame>
            </motion.div>
          )
        })}
      </div>

      {/* Seis momentos como separador visual abaixo das features */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7 }}
        className="mt-16 max-w-3xl mx-auto"
      >
        <p className="text-xs uppercase tracking-wider text-marrom font-semibold text-center mb-4">
          Os 6 momentos da reunião
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/seis-momentos.svg"
          alt="Abertura, Revisão, Reconhecimento, Equipe, Ajustes, Encerramento"
          className="w-full h-auto"
        />
      </motion.div>
    </section>
  )
}
