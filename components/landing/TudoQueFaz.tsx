'use client'

import { motion } from 'framer-motion'

// Secao compacta logo apos o Hero, listando rapidamente o que o sistema faz.
// Pensada pra usuario que entrou na pagina e quer entender o "valor total"
// em 5 segundos antes de descer pra detalhes.

const tudoQueFaz = [
  { icon: '🏆', label: 'Metas individuais (Bronze · Prata · Ouro)' },
  { icon: '🎯', label: 'Meta coletiva da equipe com prêmio' },
  { icon: '📊', label: 'Ranking ao vivo entre barbeiros' },
  { icon: '📱', label: 'Link individual por barbeiro (sem senha)' },
  { icon: '⚡', label: 'Lançamento diário em 2 minutos' },
  { icon: '💬', label: 'Cards prontos pra WhatsApp' },
  { icon: '🎮', label: 'Campanha de pontos (gamificação)' },
  { icon: '🤖', label: 'Resumo de reunião com IA' },
  { icon: '⭐', label: 'Feedback Premiado com brindes (PLUS)' },
  { icon: '💰', label: 'Controle Financeiro completo (PLUS)' },
  { icon: '👥', label: 'Acesso pra equipe inteira' },
  { icon: '♾️', label: 'Atualizações vitalícias' },
]

export default function TudoQueFaz() {
  return (
    <section className="bg-[#0A1929] border-y border-white/10 px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-7"
        >
          <span className="inline-block rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-3 py-1 text-xs font-bold text-[#D4A85A] uppercase tracking-wider mb-3">
            ✨ Tudo que o sistema faz
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Em uma olhada, o que voce leva:
          </h2>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3"
        >
          {tudoQueFaz.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-4 py-3"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className="text-[#E2E8F0] text-sm sm:text-[15px] leading-snug">
                {item.label}
              </span>
            </li>
          ))}
        </motion.ul>

        <p className="text-center text-[#A0AEC0] text-xs sm:text-sm mt-6">
          Pagamento único · Acesso vitalício · Sem mensalidade
        </p>
      </div>
    </section>
  )
}
