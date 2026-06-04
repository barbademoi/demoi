'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

export function SolucaoEmAcao() {
  return (
    <section
      id="solucao"
      className="relative px-4 py-20 bg-surface border-y border-border overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo-simbolo-transparente.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 w-[640px] h-[640px] opacity-[0.06] select-none"
      />
      <div className="relative max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="space-y-5"
        >
          <h2 className="font-serif text-3xl sm:text-4xl text-preto leading-tight">
            A reunião que conduz você.
          </h2>
          <p className="text-grafite text-lg">
            A Bússola transforma observações soltas da semana numa conversa
            estruturada com sua equipe. Você só conduz.
          </p>
          <div className="space-y-4 text-grafite leading-relaxed pt-2">
            <p>
              Durante a semana, você anota qualquer observação sobre sua equipe.
              Texto livre, em segundos, no celular.
            </p>
            <p>
              Na hora da reunião, a IA organiza tudo nos 6 momentos certos:
              <strong className="text-text"> Abertura, Revisão, Reconhecimento,
              Equipe, Ajustes e Encerramento</strong>.
            </p>
            <p>
              Em cada momento, princípios sólidos de liderança aparecem pra te
              orientar. Princípios que constroem cultura — não que só preenchem ata.
            </p>
          </div>
        </motion.div>

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
    </section>
  )
}
