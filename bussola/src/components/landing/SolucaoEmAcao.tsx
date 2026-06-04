'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

const BLOCOS = [
  {
    titulo: 'Você anota. A IA organiza.',
    texto:
      'Durante a semana, você anota qualquer observação sobre sua equipe. Texto livre, em segundos, no celular. A IA lê tudo e classifica nos 6 momentos certos da reunião.',
  },
  {
    titulo: 'A IA sugere — com fundamento.',
    texto:
      'Em cada observação, a IA traz um princípio de liderança consagrado e sugere uma forma de abordar com firmeza e respeito. Sem adivinhação. Sem "achismo".',
  },
  {
    titulo: 'A IA escreve resumos que fazem sentido.',
    texto:
      'No fim da semana, a IA gera um resumo do que aconteceu, identifica destaques e padrões, e prepara sua pauta da próxima reunião. Você lê em 2 minutos.',
  },
  {
    titulo: 'Você decide. Você fala.',
    texto:
      'A IA é parceira, não substituta. Ela prepara o terreno pra você liderar com clareza — mas a voz que vai falar com sua equipe é a sua.',
  },
]

export function SolucaoEmAcao() {
  return (
    <section
      id="solucao"
      className="relative px-4 py-20 bg-surface border-y border-border overflow-hidden"
    >
      {/* Cérebro-IA decorativo no canto direito */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/cerebro-ia.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-12 top-12 w-[420px] h-[420px] opacity-[0.08] select-none hidden md:block"
      />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
          >
            A IA que pensa por décadas de liderança — e trabalha por você.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-grafite text-lg mt-4 leading-relaxed"
          >
            A Bússola tem uma IA treinada nos fundamentos consagrados da gestão
            de pessoas. Décadas de pesquisa sobre o que funciona em equipes
            reais, princípios destilados dos maiores nomes da liderança moderna
            — tudo dentro de uma ferramenta que cabe no seu bolso.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            {BLOCOS.map((bloco, i) => (
              <motion.div
                key={bloco.titulo}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="space-y-1.5"
              >
                <h3 className="font-semibold text-text text-lg">{bloco.titulo}</h3>
                <p className="text-grafite leading-relaxed">{bloco.texto}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7 }}
          >
            <PhoneFrame size="md">
              <LazyAutoplayVideo
                src="modo-reuniao"
                poster="/landing/optimized/modo-reuniao-poster.jpg"
              />
            </PhoneFrame>
          </motion.div>
        </div>

        {/* Timeline visual dos 6 momentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <p className="text-xs uppercase tracking-wider text-marrom font-semibold text-center mb-4">
            Os 6 momentos da reunião
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/seis-momentos.svg"
            alt="Sequência dos 6 momentos: Abertura, Revisão, Reconhecimento, Equipe, Ajustes, Encerramento"
            className="w-full h-auto"
          />
        </motion.div>
      </div>
    </section>
  )
}
