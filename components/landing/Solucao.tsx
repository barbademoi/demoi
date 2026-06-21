'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const passos = [
  {
    num: '1',
    titulo: 'Você cadastra',
    texto:
      'Nome da barbearia, sua equipe, a meta de cada barbeiro (Bronze / Prata / Ouro), e o prêmio em dinheiro de cada nível.',
  },
  {
    num: '2',
    titulo: 'Cada barbeiro recebe um link próprio',
    texto:
      'Sem app, sem senha. Cada barbeiro abre o link no celular e vê: comissão acumulada, quanto falta pra cada meta e onde está no ranking da equipe.',
  },
  {
    num: '3',
    titulo: 'O time se cobra sozinho',
    texto:
      'Quem tá atrás vê quem tá na frente. A meta vira jogo. Você para de cobrar.',
  },
]

export default function Solucao() {
  return (
    <section className="bg-[#0A1929] py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
        >
          O BarberMeta é{' '}
          <span className="text-[#D4A85A]">simples assim:</span>
        </motion.h2>

        <div className="relative">
          {/* linha vertical conectando os passos */}
          <div
            aria-hidden
            className="absolute left-[27px] top-10 bottom-10 w-px bg-gradient-to-b from-[#D4A85A]/60 via-[#D4A85A]/30 to-transparent hidden sm:block"
          />

          <div className="flex flex-col gap-10">
            {passos.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex gap-5 items-start"
              >
                {/* número */}
                <div className="shrink-0 w-14 h-14 rounded-full border-2 border-[#D4A85A] bg-[#D4A85A]/10 flex items-center justify-center">
                  <span className="text-[#D4A85A] font-bold text-xl">{p.num}</span>
                </div>

                <div className="pt-2">
                  <h3 className="text-white font-bold text-xl mb-2">{p.titulo}</h3>
                  <p className="text-[#A0AEC0] text-base leading-relaxed">{p.texto}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-16 flex justify-center"
        >
          <CTAButton label="Ver como funciona →" size="md" id="cta-solucao-oferta" gtmClass="gtm-cta-solucao" />
        </motion.div>

      </div>
    </section>
  )
}
