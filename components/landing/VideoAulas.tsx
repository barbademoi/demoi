'use client'

import { motion } from 'framer-motion'

const aulas = [
  { num: '01', titulo: 'Configurando sua barbearia', dur: '4 min' },
  { num: '02', titulo: 'Cadastrando os barbeiros', dur: '3 min' },
  { num: '03', titulo: 'Criando metas Bronze, Prata e Ouro', dur: '5 min' },
  { num: '04', titulo: 'Lançando o faturamento diário', dur: '3 min' },
  { num: '05', titulo: 'Compartilhando o link de cada barbeiro', dur: '2 min' },
  { num: '06', titulo: 'Configurando a campanha de pontos', dur: '6 min' },
]

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function VideoAulas() {
  return (
    <section className="bg-[#0A1929] py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.div {...fadeIn()} className="text-center mb-10">
          <p className="text-[#D4A85A] text-xs font-semibold uppercase tracking-widest mb-2">
            Incluído na compra
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Vídeo aulas gravadas{' '}
            <span className="text-[#D4A85A]">por mim.</span>
          </h2>
          <p className="mt-3 text-[#A0AEC0] text-lg">
            Do zero ao funcionando em menos de 30 minutos.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* mockup do player */}
          <motion.div {...fadeIn(0.1)} className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl">
            {/* barra do player */}
            <div className="bg-[#0F1F2D] px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-[#A0AEC0] font-mono truncate">
                barbermeta.com.br/aulas
              </span>
            </div>

            {/* tela do vídeo */}
            <div className="relative bg-[#060F18] aspect-video flex items-center justify-center group cursor-pointer">
              {/* thumbnail simulado */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F1F2D] to-[#060F18]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <p className="text-[#A0AEC0] text-xs uppercase tracking-widest">Aula 01</p>
                <p className="text-white font-bold text-lg text-center px-6">
                  Configurando sua barbearia
                </p>
              </div>
              {/* botão play */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#D4A85A] flex items-center justify-center shadow-lg shadow-[#D4A85A]/30 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* barra de progresso */}
            <div className="bg-[#0F1F2D] px-4 py-3 flex items-center gap-3">
              <span className="text-[#A0AEC0] text-xs">0:00</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="w-0 h-full bg-[#D4A85A] rounded-full" />
              </div>
              <span className="text-[#A0AEC0] text-xs">4:12</span>
            </div>
          </motion.div>

          {/* lista de aulas */}
          <motion.div {...fadeIn(0.15)} className="rounded-2xl border border-white/8 bg-[#0F1F2D] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">
                Conteúdo do curso — {aulas.length} aulas
              </p>
            </div>
            {aulas.map((a, i) => (
              <motion.div
                key={a.num}
                {...fadeIn(0.18 + i * 0.06)}
                className={`flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 ${
                  i === 0 ? 'bg-[#D4A85A]/8' : 'hover:bg-white/3'
                } transition-colors`}
              >
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? 'bg-[#D4A85A] text-black'
                    : 'bg-white/8 text-[#A0AEC0]'
                }`}>
                  {i === 0
                    ? <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    : a.num
                  }
                </span>
                <span className={`flex-1 text-sm ${i === 0 ? 'text-white font-medium' : 'text-[#A0AEC0]'}`}>
                  {a.titulo}
                </span>
                <span className="shrink-0 text-xs text-[#A0AEC0]">{a.dur}</span>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* nota */}
        <motion.p {...fadeIn(0.5)} className="mt-6 text-center text-sm text-[#A0AEC0]">
          Acesso às aulas liberado junto com o sistema, na mesma compra.
        </motion.p>

      </div>
    </section>
  )
}
