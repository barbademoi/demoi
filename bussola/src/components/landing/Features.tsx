'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { PenLine, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { PhoneFrame } from './PhoneFrame'

interface Feature {
  icon: LucideIcon
  titulo: string
  descricao: string
  img: string
  size: 'sm' | 'md'
}

const FEATURES: Feature[] = [
  {
    icon: PenLine,
    titulo: 'Você anota em segundos',
    descricao: 'Texto livre no celular. Sem categoria, sem complicação. A IA cuida do resto.',
    img: '/landing/feature-1-anotar-mobile.png',
    size: 'sm',
  },
  {
    icon: Sparkles,
    titulo: 'A IA organiza tudo',
    descricao: 'No dia da reunião, sua pauta aparece pronta com princípios de liderança aplicados.',
    img: '/landing/feature-2-preparar-mobile.png',
    size: 'md',
  },
  {
    icon: Users,
    titulo: 'Você conduz com clareza',
    descricao: 'Modo Reunião guia você nos 6 momentos. Equipe entende. Cultura se constrói.',
    img: '/landing/feature-3-modo-reuniao-mobile.png',
    size: 'sm',
  },
]

// Classes de margin-top que formam a escada diagonal em desktop.
// Em mobile (sem md:), tudo zera pra stack reto.
const DIAGONAL_MT = ['md:mt-0', 'md:mt-20', 'md:mt-40']

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const reduced = useReducedMotion()

  // Parallax sutil: card 1 sobe levemente, card 3 desce, card 2 fica âncora.
  const y1 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -10])
  const y3 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 10])

  return (
    <section ref={sectionRef} className="px-4 pt-20 pb-24 md:pb-40 max-w-6xl mx-auto">
      <div className="text-center mb-12 space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          O que a Bússola faz por você.
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

      {/* Grid com escada diagonal em desktop, stack reto em mobile */}
      <div className="grid md:grid-cols-3 gap-8 md:gap-6 items-start">
        {FEATURES.map((f, i) => {
          const Icon = f.icon
          const yMotion = i === 0 ? y1 : i === 2 ? y3 : undefined
          return (
            <motion.div
              key={f.titulo}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              style={yMotion ? { y: yMotion } : undefined}
              className={`card p-5 space-y-4 ${DIAGONAL_MT[i]} hover:-translate-y-1 transition-transform`}
            >
              <Icon size={60} strokeWidth={1.4} className="text-marrom" />
              <h3 className="font-semibold text-text text-lg">{f.titulo}</h3>
              <p className="text-sm text-grafite leading-relaxed">{f.descricao}</p>
              <PhoneFrame size={f.size}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.img}
                  alt={f.titulo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </PhoneFrame>
            </motion.div>
          )
        })}
      </div>

      {/* seis-momentos.svg como timeline visual abaixo */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7 }}
        className="mt-20 md:mt-32 max-w-3xl mx-auto text-center space-y-4"
      >
        <p className="text-xs uppercase tracking-wider text-marrom font-semibold">
          Os 6 momentos da reunião
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/seis-momentos.svg"
          alt="Abertura, Revisão, Reconhecimento, Equipe, Ajustes, Encerramento"
          className="w-full h-auto"
        />
        <p className="text-sm text-grafite max-w-2xl mx-auto">
          Cada momento com princípio de liderança e sugestão de fala. Direto do
          que funciona em equipes reais.
        </p>
      </motion.div>
    </section>
  )
}
