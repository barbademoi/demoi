'use client'

import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa6'
import { AnimatedNumber } from './AnimatedNumber'
import { PhoneFrame } from './PhoneFrame'
import { AutoplayVideo } from './AutoplayVideo'

export function ProvaSocial() {
  return (
    <section className="px-4 py-20 max-w-5xl mx-auto space-y-14">
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
        <Stat
          numero={
            <span className="inline-flex items-center gap-1">
              <AnimatedNumber to={5.0} decimals={1} />
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.6, delay: 0.5, type: 'spring' }}
              >
                <FaStar className="text-[#FFC107]" size={36} />
              </motion.span>
            </span>
          }
          label="média dos clientes"
          delay={0.3}
        />
      </div>

      {/* 2 cards de output da IA */}
      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
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
          <p className="text-xs text-chumbo mt-3">— IA da Bússola</p>
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
          <div className="border-t border-marrom/20" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-marrom font-semibold mb-1">
              Sugestão de fala
            </p>
            <p className="text-text italic text-sm leading-snug">
              &ldquo;Zé, queria reconhecer aqui na frente do time: seu atendimento
              ao cliente das 14h foi modelo.&rdquo;
            </p>
          </div>
          <p className="text-xs text-chumbo">— IA da Bússola, momento Reconhecimentos</p>
        </motion.article>
      </div>

      {/* Terceiro elemento: print de feedbacks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7 }}
        className="max-w-sm mx-auto text-center space-y-4"
      >
        <p className="text-[10px] uppercase tracking-wider text-marrom font-semibold">
          A voz dos clientes dentro do painel
        </p>
        <PhoneFrame size="md">
          <AutoplayVideo
            src="feedbacks-mobile"
            poster="/landing/optimized/feedbacks-mobile-poster.jpg"
          />
        </PhoneFrame>
        <p className="text-sm text-grafite">
          Cada feedback vira combustível pra próxima reunião.
        </p>
      </motion.div>
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
