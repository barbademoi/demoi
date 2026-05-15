'use client'

import { motion } from 'framer-motion'

const linhas = [
  ['Texto no WhatsApp que ninguém abre', 'Card profissional no celular de cada um'],
  ['Você cobra no fim do mês', 'Equipe se cobra sozinha, todo dia'],
  ['Descobre no dia 28 quem não bateu', 'Ranking ao vivo, atualizado em tempo real'],
  ['Barbeiro sem competição perde gás', 'Quem tá atrás vê quem tá na frente'],
  ['Planilha que ninguém atualiza', 'Lançamento em 2 minutos pelo celular'],
  ['Sem histórico de metas batidas', 'Histórico mês a mês de cada barbeiro'],
]

export default function Comparacao() {
  return (
    <section className="bg-[#0F1F2D] py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-14"
        >
          Compara como você manda meta hoje:
        </motion.h2>

        {/* cabeçalho */}
        <div className="grid grid-cols-2 gap-3 mb-3 px-1">
          <div className="rounded-xl bg-red-950/40 border border-red-800/30 py-3 px-4 text-center">
            <span className="text-red-400 font-bold text-sm uppercase tracking-wide">
              Sem BarberMeta
            </span>
          </div>
          <div className="rounded-xl bg-green-950/40 border border-green-800/30 py-3 px-4 text-center">
            <span className="text-green-400 font-bold text-sm uppercase tracking-wide">
              Com BarberMeta
            </span>
          </div>
        </div>

        {/* linhas */}
        <div className="flex flex-col gap-2">
          {linhas.map(([sem, com], i) => (
            <motion.div
              key={sem}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="rounded-xl bg-red-950/20 border border-red-900/20 py-3 px-4 flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                <span className="text-[#A0AEC0] text-sm leading-snug">{sem}</span>
              </div>
              <div className="rounded-xl bg-green-950/20 border border-green-900/20 py-3 px-4 flex items-start gap-2">
                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                <span className="text-[#E2E8F0] text-sm leading-snug">{com}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
