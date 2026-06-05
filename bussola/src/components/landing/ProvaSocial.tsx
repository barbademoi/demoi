'use client'

import { motion } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'

export function ProvaSocial() {
  return (
    <section className="px-4 py-20 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          Testada por meses numa barbearia real.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-grafite"
        >
          Construída na Demôi Barbearia em Cássia/MG. Onde a cultura virou o
          forte da equipe.
        </motion.p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat numero={<AnimatedNumber to={11} />} label="pessoas na equipe" delay={0} />
        <Stat numero={<><AnimatedNumber to={1700} />+</>} label="atendimentos/mês" delay={0.15} />
        <Stat numero={<><AnimatedNumber to={5.0} decimals={1} />★</>} label="média dos clientes" delay={0.3} />
      </div>

      {/* Cards de output da IA */}
      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto pt-4">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6 }}
          className="rounded-lg border-l-4 border-marrom bg-linho p-5 shadow-sm"
        >
          <p className="text-[10px] uppercase tracking-wider text-chumbo font-semibold mb-3">
            Resumo da semana · IA
          </p>
          <p className="text-text italic leading-relaxed text-sm">
            &ldquo;Semana de puro fogo! Zé Lucas é destaque absoluto com seis
            feedbacks cinco estrelas elogiando atendimento rápido e excelente,
            enquanto Rael bomba com paciência e carisma reconhecidos pelos
            clientes.&rdquo;
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-lg border-l-4 border-marrom bg-linho p-5 shadow-sm space-y-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-chumbo font-semibold">
            Princípio + sugestão de fala · IA
          </p>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-marrom font-semibold mb-1">
              Princípio
            </p>
            <p className="text-text font-semibold text-sm leading-snug">
              Elogio precisa ser específico ao comportamento, não genérico à pessoa.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-marrom font-semibold mb-1">
              Sugestão de fala
            </p>
            <p className="text-text italic text-sm leading-snug">
              &ldquo;Zé, queria reconhecer aqui na frente do time: seu atendimento
              ao cliente das 14h foi modelo.&rdquo;
            </p>
          </div>
        </motion.article>
      </div>
    </section>
  )
}

function Stat({ numero, label, delay }: { numero: React.ReactNode; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <p className="font-serif text-3xl sm:text-5xl text-marrom font-bold leading-none">{numero}</p>
      <p className="text-xs sm:text-sm text-chumbo mt-1.5">{label}</p>
    </motion.div>
  )
}
