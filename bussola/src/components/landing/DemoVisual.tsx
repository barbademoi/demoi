'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { LazyAutoplayVideo } from './LazyAutoplayVideo'

// Seção full-width com o vídeo grande do Modo Reunião centralizado.
// Mobile: PhoneFrame size lg. Desktop: container max 900px com sombra.
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

        {/* Mobile: PhoneFrame. Desktop: vídeo grande direto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
        >
          <div className="md:hidden">
            <PhoneFrame size="lg">
              <LazyAutoplayVideo
                src="modo-reuniao"
                poster="/landing/optimized/modo-reuniao-poster.jpg"
              />
            </PhoneFrame>
          </div>
          <div className="hidden md:block max-w-[420px] mx-auto">
            <PhoneFrame size="lg">
              <LazyAutoplayVideo
                src="modo-reuniao"
                poster="/landing/optimized/modo-reuniao-poster.jpg"
              />
            </PhoneFrame>
          </div>
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
