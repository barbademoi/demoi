'use client'

import { motion } from 'framer-motion'

const dores = [
  {
    emoji: '😤',
    titulo: 'Cobrança chata todo fim de mês',
    texto:
      'Fim de mês chega, você precisa cobrar quem não bateu meta. A conversa fica pesada, o barbeiro fica chateado, a relação esfria.',
  },
  {
    emoji: '💬',
    titulo: 'Texto no WhatsApp não motiva',
    texto:
      '"Galera, meta esse mês é 5k". Ninguém liga. Ninguém abre. No dia 15, ninguém lembra mais.',
  },
  {
    emoji: '👀',
    titulo: 'Você não sabe quem tá batendo',
    texto:
      'Só descobre no dia 28 que metade da equipe tá longe da meta. Aí não tem mais tempo de fazer ninguém correr.',
  },
  {
    emoji: '🔥',
    titulo: 'Barbeiro sem competição perde gás',
    texto:
      'Sem ver o que os outros tão fazendo, cada um trabalha no próprio ritmo. Sem fogo, sem urgência.',
  },
]

export default function Dor() {
  return (
    <section className="bg-[#0F1F2D] py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-14"
        >
          Você reconhece alguma dessas?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {dores.map((d, i) => (
            <motion.div
              key={d.titulo}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-white/8 bg-[#0A1929] p-6 flex gap-4"
            >
              <span className="text-3xl shrink-0 mt-0.5">{d.emoji}</span>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">{d.titulo}</h3>
                <p className="text-[#A0AEC0] text-base leading-relaxed">{d.texto}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14 text-center text-xl sm:text-2xl font-semibold"
        >
          <span className="text-white">Tudo isso se resolve com </span>
          <span className="text-[#D4A85A]">1 sistema simples.</span>
          <span className="text-white"> Te mostro.</span>
        </motion.p>

      </div>
    </section>
  )
}
