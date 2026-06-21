'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const smallCards = [
  {
    emoji: '⚡',
    titulo: 'Lançamento em 2 minutos',
    texto: 'Registra o faturamento do dia em 1 tela. Sem planilha, sem app complicado.',
  },
  {
    emoji: '🖼️',
    titulo: 'Cards prontos pra WhatsApp',
    texto: 'Baixa o card de cada barbeiro e manda no grupo. Bonito, profissional.',
  },
  {
    emoji: '🏅',
    titulo: 'Campanha de pontos',
    texto: 'Configure quais serviços pontuam e quantos pontos. Assinatura, hidratação, produto vendido.',
  },
]

const tudoQueFaz = [
  {
    grupo: 'Metas e comissão',
    itens: [
      'Metas individuais por barbeiro com 3 tiers (Bronze · Prata · Ouro)',
      'Meta coletiva da barbearia com prêmios próprios',
      'Cálculo automático de comissão acumulada do ciclo',
      'Ranking ao vivo entre barbeiros',
      'Comparativo de meses (4 meses lado a lado)',
      'Histórico de meses navegável',
    ],
  },
  {
    grupo: 'Link individual do barbeiro',
    itens: [
      'Cada barbeiro tem seu próprio link público — sem senha, sem app',
      'Vê comissão acumulada, ritmo e posição no ranking',
      'Mensagem motivadora diária gerada por IA',
      'Configuração de visibilidade do ranking (completo · só posição · só o próprio)',
      'Configuração pra mostrar/esconder faturamento geral e ticket médio',
    ],
  },
  {
    grupo: 'Campanha de pontos (gamificação)',
    itens: [
      'Configure quais serviços pontuam e quanto cada um vale',
      'Slot fixo de assinatura com bônus por quantidade vendida',
      'Pontos mínimos pra participar (separado pra barbeiro e recepcionista)',
      'Premiação por posição no ranking de pontos',
      'Regras gerais editáveis pelo dono',
    ],
  },
  {
    grupo: 'Feedback de Cliente + brindes',
    plus: true,
    itens: [
      'Link público pra cliente avaliar (com QR Code e botão de WhatsApp)',
      'Brindes sorteados ponderados por peso (você define a chance de cada um)',
      'Validade configurável do brinde (15 / 30 / 60 / 90 dias)',
      'Brinde mínimo garantido (cliente nunca sai sem nada)',
      'Direcionamento de 4+ estrelas pra Google Reviews',
      'Brinde aparece no link do barbeiro pra ele oferecer no próximo atendimento',
      'Painel filtrado por período, estrela, barbeiro e brinde',
      'Gamificação opcional: feedback positivo dá pontos pro barbeiro',
    ],
  },
  {
    grupo: 'Controle Financeiro',
    plus: true,
    itens: [
      'Caixa (banco, dinheiro, Pix) — quanto tem em cada um',
      'Contas a pagar (única, fixa mensal, parcelada)',
      'Contas a receber',
      'Folha da equipe com sincronização automática do BarberMeta',
      'Quanto sobra no mês (demonstrativo claro)',
      'Empresa + Pessoal separados',
      'Tudo na nuvem, sincroniza entre aparelhos',
    ],
  },
  {
    grupo: 'Comunicação e operação',
    itens: [
      'Lançamento diário em 1 tela (2 minutos)',
      'Cards prontos pra mandar no WhatsApp do grupo',
      'Resumo de reunião gerado por IA pro início do mês',
      'Modo Equipe ou Modo Sozinho (autônomo) — o sistema se adapta',
    ],
  },
  {
    grupo: 'Aprendizado incluso',
    itens: [
      '6 aulas curtas com Carlos Henrique (dono que usa o sistema)',
      '2 tipos de metas + gamificação explicados na prática',
      'Tutoriais em vídeo dentro do dashboard',
    ],
  },
]

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="bg-[#0F1F2D] py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeIn()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
        >
          Tudo que você precisa,{' '}
          <span className="text-[#D4A85A]">nada que você não precisa.</span>
        </motion.h2>
        <motion.p
          {...fadeIn(0.1)}
          className="text-center text-[#A0AEC0] text-lg mb-12"
        >
          Simples de usar.
        </motion.p>

        {/* ── bento grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* card grande — ranking ao vivo (2 colunas no lg) */}
          <motion.div
            {...fadeIn(0.1)}
            className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="p-7 flex flex-col justify-center sm:w-1/2">
              <span className="text-3xl mb-3">🏆</span>
              <h3 className="text-white font-bold text-xl mb-2">Ranking ao vivo</h3>
              <p className="text-[#A0AEC0] text-base leading-relaxed">
                Cada barbeiro vê onde está. Quem tá atrás, corre. Sem você precisar falar nada.
              </p>
            </div>
            <div className="sm:w-1/2 flex items-start justify-center p-4 pt-0 sm:pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/01-dashboard-ranking.png"
                alt="Ranking ao vivo dos barbeiros"
                className="w-full h-auto rounded-xl"
              />
            </div>
          </motion.div>

          {/* card — link individual do barbeiro */}
          <motion.div
            {...fadeIn(0.2)}
            className="rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col"
          >
            <div className="p-4 pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/03-barbeiro-individual.png"
                alt="Página individual do barbeiro"
                className="w-full h-auto rounded-xl"
              />
            </div>
            <div className="p-6 pt-4">
              <h3 className="text-white font-bold text-lg mb-1">Link individual por barbeiro</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">
                Cada barbeiro tem seu próprio link. Acessa pelo celular, vê comissão, ritmo e metas — sem senha.
              </p>
            </div>
          </motion.div>

          {/* card — meta coletiva */}
          <motion.div
            {...fadeIn(0.25)}
            className="rounded-2xl border border-white/8 bg-[#0A1929] overflow-hidden flex flex-col"
          >
            <div className="p-4 pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/05-meta-coletiva.png"
                alt="Meta coletiva da barbearia"
                className="w-full h-auto rounded-xl"
              />
            </div>
            <div className="p-6 pt-4">
              <h3 className="text-white font-bold text-lg mb-1">Meta coletiva da equipe</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">
                Defina uma meta geral pra barbearia com premiação. Todo mundo puxa junto.
              </p>
            </div>
          </motion.div>

          {/* 3 cards pequenos */}
          {smallCards.map((c, i) => (
            <motion.div
              key={c.titulo}
              {...fadeIn(0.3 + i * 0.08)}
              className="rounded-2xl border border-white/8 bg-[#0A1929] p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{c.emoji}</span>
              <h3 className="text-white font-bold text-base">{c.titulo}</h3>
              <p className="text-[#A0AEC0] text-sm leading-relaxed">{c.texto}</p>
            </motion.div>
          ))}

        </div>

        {/* ── DESTAQUE: Estratégia de Feedback Premiado ── */}
        <motion.div
          {...fadeIn(0.4)}
          className="mt-16 rounded-3xl border border-[#D4A85A]/30 bg-gradient-to-br from-[#0A1929] to-[#1A1410] overflow-hidden"
        >
          <div className="p-7 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#D4A85A] text-[#0F1117] px-3 py-1 text-xs font-bold mb-4">
              <span>⭐</span>
              <span>EXCLUSIVO DO PLUS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Estratégia de <span className="text-[#D4A85A]">Feedback Premiado</span>
            </h3>
            <p className="text-[#A0AEC0] text-base sm:text-lg leading-relaxed max-w-3xl">
              Transforma cada cliente em fã com uma estratégia simples: ele avalia → ganha um brinde → o barbeiro
              vê o brinde no celular dele → oferece no próximo atendimento. <span className="text-white font-semibold">O cliente volta.</span>
            </p>
            <p className="text-[#D4A85A] text-sm mt-3 font-semibold">
              Incluso no Combo R$ 67 · Ou adicional R$ 29 pra quem já tem BarberMeta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-white/5 px-1 pb-1">
            {/* Etapa 1 — Dono configura */}
            <div className="bg-[#0A1929] p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4A85A]/20 text-[#D4A85A] font-bold text-sm">1</span>
                <h4 className="text-white font-bold text-base">Dono configura</h4>
              </div>
              <p className="text-[#A0AEC0] text-sm leading-relaxed mb-4">
                Cadastra os brindes com o peso de cada um. Define validade (15 / 30 / 60 / 90 dias) e gera o link público.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/feedback-config.png"
                alt="Tela de configuração do feedback de cliente"
                className="mt-auto w-full h-auto rounded-xl border border-white/8"
              />
            </div>

            {/* Etapa 2 — Cliente avalia */}
            <div className="bg-[#0A1929] p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4A85A]/20 text-[#D4A85A] font-bold text-sm">2</span>
                <h4 className="text-white font-bold text-base">Cliente avalia e ganha</h4>
              </div>
              <p className="text-[#A0AEC0] text-sm leading-relaxed mb-4">
                Acessa pelo QR Code ou WhatsApp, deixa estrelas + comentário e ganha um brinde sorteado na hora.
                Quem dá 4+ estrelas vai pro Google Reviews.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/feedback-painel.png"
                alt="Painel do dono com feedbacks recebidos"
                className="mt-auto w-full h-auto rounded-xl border border-white/8"
              />
            </div>

            {/* Etapa 3 — Barbeiro oferece */}
            <div className="bg-[#0A1929] p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4A85A]/20 text-[#D4A85A] font-bold text-sm">3</span>
                <h4 className="text-white font-bold text-base">Barbeiro vê e oferece</h4>
              </div>
              <p className="text-[#A0AEC0] text-sm leading-relaxed mb-4">
                No link dele aparece quem avaliou, qual brinde ganhou e o código. Ele oferece no próximo
                atendimento — cliente volta pra usar.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/feedback-barbeiro.png"
                alt="Tela do barbeiro mostrando o brinde do cliente"
                className="mt-auto w-full h-auto rounded-xl border border-white/8"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Lista completa do que o sistema faz ── */}
        <motion.div
          {...fadeIn(0.5)}
          className="mt-16"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            Tudo o que o sistema faz
          </h3>
          <p className="text-center text-[#A0AEC0] text-base mb-10">
            Lista completa, sem letrinha miúda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tudoQueFaz.map((g) => (
              <div
                key={g.grupo}
                className={`rounded-2xl border p-6 ${g.plus
                  ? 'border-[#D4A85A]/50 bg-gradient-to-br from-[#0A1929] to-[#1A1410]'
                  : 'border-white/8 bg-[#0A1929]'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <h4 className="text-[#D4A85A] font-bold text-base">{g.grupo}</h4>
                  {g.plus && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#D4A85A] text-[#0F1117] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                      ⭐ Plus
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {g.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[#A0AEC0] text-sm leading-relaxed">
                      <span className="text-[#D4A85A] mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          {...fadeIn(0.6)}
          className="mt-12 flex justify-center"
        >
          <CTAButton id="cta-funcionalidades-oferta" gtmClass="gtm-cta-funcionalidades" />
        </motion.div>

      </div>
    </section>
  )
}
