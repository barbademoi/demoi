'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const smallCards = [
  {
    emoji: '⚡',
    titulo: 'Lançamento em 2 minutos',
    texto: 'Lança o faturamento do dia em 1 tela. Sem planilha.',
  },
  {
    emoji: '🖼️',
    titulo: 'Cards prontos pra WhatsApp',
    texto: 'Baixa o card de cada barbeiro e manda no grupo. Bonito, profissional.',
  },
  {
    emoji: '📅',
    titulo: 'Histórico mês a mês',
    texto: 'Vê quem bateu meta em cada mês. Histórico completo de produtividade.',
  },
]

export default function Funcionalidades() {
  return (
    <section className="bg-[#0F1F2D] py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeIn()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
        >
          Tudo que você precisa,{' '}
          <span className="text-[#D4A85A]">nada que você não precisa.</span>
        </motion.h2>
        <motion.p
          {...fadeIn(0.1)}
          className="text-center text-[#A0AEC0] text-lg mb-14"
        >
          Simples de usar. Funciona no celular.
        </motion.p>

        {/* ── bento grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* card grande — ranking ao vivo (2 colunas no lg) */}
          <motion.div
            {...fadeIn(0.1)}
            className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="p-7 flex flex-col justify-center sm:w-1/2">
              <span className="text-3xl mb-3">🏆</span>
              <h3 className="text-white font-bold text-xl mb-2">Ranking ao vivo</h3>
              <p className="text-[#A0AEC0] text-base leading-relaxed">
                Cada barbeiro vê onde está. Quem tá atrás, corre. Sem você precisar falar nada.
              </p>
            </div>
            <div className="sm:w-1/2 relative min-h-[220px] overflow-hidden">
              <Image
                src="/prints/01-dashboard-ranking.png"
                alt="Ranking ao vivo dos barbeiros"
                fill
                className="object-cover object-top"
              />
            </div>
          </motion.div>

          {/* card médio — metas B/P/O */}
          <motion.div
            {...fadeIn(0.2)}
            className="rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col"
          >
            <div className="relative h-44 overflow-hidden">
              <Image
                src="/prints/02-card-barbeiro.png"
                alt="Metas Bronze, Prata e Ouro"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-1">Metas Bronze / Prata / Ouro</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">
                3 metas pra cada barbeiro, cada uma com seu prêmio. Quem é Ouro fica orgulhoso. Quem é Bronze quer mais.
              </p>
            </div>
          </motion.div>

          {/* card médio — acesso mobile */}
          <motion.div
            {...fadeIn(0.25)}
            className="rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col"
          >
            <div className="relative h-44 overflow-hidden">
              <Image
                src="/prints/03-mobile-view.png"
                alt="Acesso individual pelo celular"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-1">Acesso individual pelo celular</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">
                Cada barbeiro tem seu próprio link. Acessa pelo celular sem precisar de senha complicada.
              </p>
            </div>
          </motion.div>

          {/* 3 cards pequenos */}
          {smallCards.map((c, i) => (
            <motion.div
              key={c.titulo}
              {...fadeIn(0.3 + i * 0.08)}
              className="rounded-2xl border border-white/8 bg-[#0A1929] p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{c.emoji}</span>
              <h3 className="text-white font-bold text-base">{c.titulo}</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">{c.texto}</p>
            </motion.div>
          ))}

        </div>

        {/* CTA #2 */}
        <motion.div
          {...fadeIn(0.5)}
          className="mt-14 flex justify-center"
        >
          <CTAButton />
        </motion.div>

      </div>
    </section>
  )
}
