'use client'

import { motion } from 'framer-motion'
import { AlertCircle, MessageCircleX, TrendingDown, type LucideIcon } from 'lucide-react'

const DORES = [
  {
    icon: AlertCircle,
    titulo: 'Reunião que vira papo solto',
    texto: 'Cada um sai com uma sensação diferente. Você mesmo não sabe se foi produtiva.',
  },
  {
    icon: MessageCircleX,
    titulo: 'Cobrança que sai errada',
    texto: 'Dura demais quando queria firmeza. Ou mole demais quando precisava ser direto.',
  },
  {
    icon: TrendingDown,
    titulo: 'Equipe que não cresce',
    texto: 'Você sente que poderia render mais, mas não sabe o que mudar.',
  },
]

export function Problema() {
  return (
    <section className="px-4 py-20 max-w-5xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          Você não vai virar líder lendo livro de gestão.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-grafite"
        >
          Você é dono. Atende cliente, paga conta, resolve problema, ainda
          lidera 5, 10, 20 pessoas. Onde sobra tempo pra estudar liderança?
        </motion.p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {DORES.map((d, i) => (
          <CardDor key={d.titulo} {...d} delay={i * 0.15} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-14 font-serif text-2xl sm:text-3xl text-marrom text-center leading-snug max-w-3xl mx-auto"
      >
        O problema não é você. É que ninguém te ensinou isso na prática.
      </motion.p>
    </section>
  )
}

function CardDor({ icon: Icon, titulo, texto, delay }: { icon: LucideIcon; titulo: string; texto: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="card p-5 space-y-3"
    >
      <Icon size={40} strokeWidth={1.5} className="text-marrom" />
      <h3 className="font-semibold text-text">{titulo}</h3>
      <p className="text-sm text-grafite leading-relaxed">{texto}</p>
    </motion.div>
  )
}
