'use client'

import { motion } from 'framer-motion'
import { Star, Sparkles } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { PhoneFrame } from './PhoneFrame'
import { AutoplayVideo } from './AutoplayVideo'

// Seção 7: mostra a perspectiva da equipe (vídeo) + reforço estratégico de
// captação automática de Google Reviews (3 mini-cards em fluxo).
export function SuaEquipeVeAssim() {
  return (
    <section className="px-4 py-20 md:py-24 bg-linho/30 border-y border-border">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-wider text-marrom font-semibold"
        >
          E sua equipe?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
        >
          Sua equipe vê assim no celular dela.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-grafite"
        >
          Sem app, sem login, sem complicação. Cada pessoa recebe um link único
          e acompanha tudo pelo celular.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-[320px] mx-auto pt-4"
        >
          <PhoneFrame size="md">
            <AutoplayVideo
              src="tela-do-colaborador"
              poster="/landing/optimized/tela-do-colaborador-poster.jpg"
            />
          </PhoneFrame>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-grafite"
        >
          Anotação, brinde sorteado, confirmação de leitura. Tudo num link.
        </motion.p>
      </div>

      {/* ─── Mini-bloco: Google Reviews ─────────────────────── */}
      <div className="max-w-5xl mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6 }}
          className="h-px bg-marrom/20 max-w-xs mx-auto mb-12"
        />

        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-wider text-marrom font-semibold"
          >
            E tem mais
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-2xl sm:text-3xl text-preto leading-tight"
          >
            Cliente satisfeito vira 5★ no Google. Sem você pedir.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-grafite leading-relaxed"
          >
            A Bússola convida automaticamente cada cliente que deu 5 estrelas
            internamente a postar avaliação no Google. Em 30 segundos, no
            celular. Sem app, sem complicação. Sua empresa sobe no Maps. Mais
            clientes encontram você pesquisando &ldquo;perto de mim&rdquo;.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <MiniCard
            icone={<Star size={40} strokeWidth={1.5} className="text-marrom" />}
            titulo="Cliente avalia internamente"
            texto="5★ + comentário sobre o atendimento."
            delay={0}
          />
          <MiniCard
            icone={<Sparkles size={40} strokeWidth={1.5} className="text-marrom" />}
            titulo="Bússola convida"
            texto="Automaticamente envia link do Google Reviews."
            delay={0.15}
          />
          <MiniCard
            icone={<FcGoogle size={40} />}
            titulo="Vira avaliação 5★ no Google"
            texto="Sua empresa sobe no Maps e atrai mais clientes."
            delay={0.3}
          />
        </div>

        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-serif text-xl sm:text-2xl text-marrom text-center leading-snug max-w-3xl mx-auto mt-10"
        >
          Mais avaliações = mais clientes vindo do Google. Sem você fazer
          esforço extra.
        </motion.p>
      </div>
    </section>
  )
}

function MiniCard({
  icone,
  titulo,
  texto,
  delay,
}: {
  icone: React.ReactNode
  titulo: string
  texto: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay }}
      className="card p-5 space-y-3 text-center"
    >
      <div className="flex justify-center">{icone}</div>
      <h4 className="font-semibold text-text">{titulo}</h4>
      <p className="text-sm text-grafite leading-relaxed">{texto}</p>
    </motion.div>
  )
}
