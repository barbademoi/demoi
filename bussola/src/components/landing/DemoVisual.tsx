'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { AutoplayVideo } from './AutoplayVideo'

// Seção full-width com vídeo grande do Modo Reunião. Usa AutoplayVideo
// DIRETO (não lazy) — esse vídeo é prova visual principal e precisa
// começar a carregar imediatamente.
export function DemoVisual() {
  return (
    <section id="demo" className="px-4 py-16 bg-surface border-y border-border">
      <div className="max-w-4xl mx-auto space-y-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-wider text-marrom font-semibold"
        >
          Veja a Bússola em ação
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
          className="max-w-[420px] mx-auto"
        >
          <PhoneFrame size="lg">
            <AutoplayVideo
              src="modo-reuniao"
              poster="/landing/optimized/modo-reuniao-poster.jpg"
            />
          </PhoneFrame>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-grafite"
        >
          30 segundos pra entender. Sem áudio, sem explicação.
        </motion.p>
      </div>
    </section>
  )
}
