'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTrackingHandlers } from '@/lib/utms'

const URL_BM = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'
const URL_COMBO = 'https://pay.hotmart.com/K106318479K'

const bmInclui = [
  'Metas individuais (Bronze · Prata · Ouro)',
  'Meta coletiva da equipe com prêmio',
  'Ranking ao vivo entre barbeiros',
  'Link individual por barbeiro (sem senha)',
  'Lançamento diário em 2 minutos',
  'Cards prontos pra WhatsApp',
  'Campanha de pontos (gamificação)',
  'Resumo de reunião com IA',
  '6 aulas comigo ensinando metas e gamificação',
  'Acesso pra equipe inteira',
  'Atualizações vitalícias',
]

const comboExtra = [
  'Feedback Premiado — link público pra cliente avaliar',
  'Brindes sorteados ponderados por peso',
  'Brinde aparece no link do barbeiro pra oferecer no próximo atendimento',
  'Direcionamento de 5★ pro Google Reviews',
  'Controle Financeiro — caixa, contas a pagar/receber',
  'Folha da equipe (auto-sincroniza com comissões do BarberMeta)',
  'Demonstrativo: quanto sobra no mês',
  'Empresa + Pessoal separados',
]

const faq = [
  {
    q: 'Qual a diferença real entre os 2 planos?',
    a: 'O BarberMeta R$ 47 é metas + ranking + link do barbeiro. O Combo R$ 67 inclui TUDO disso + 2 módulos premium: Feedback Premiado (clientes avaliam e ganham brindes — voltam) e Controle Financeiro (caixa, contas, folha e quanto sobra).',
  },
  {
    q: 'É pagamento único mesmo?',
    a: 'Sim. Pagou uma vez e usa pra sempre. Sem mensalidade, sem cobrança recorrente, sem letrinha miúda. As atualizações futuras você recebe grátis.',
  },
  {
    q: 'Posso testar antes?',
    a: 'Tem 7 dias de garantia incondicional. Se não gostar, devolvemos o dinheiro — sem pergunta.',
  },
  {
    q: 'Funciona pra quem é autônomo (sozinho)?',
    a: 'Sim. Na primeira vez que entrar você escolhe modo Equipe ou Sozinho. No modo Sozinho, o sistema esconde ranking e meta coletiva — fica focado em ti.',
  },
]

export default function OfertaPage() {
  // Handlers mutam o href no instante do clique — UTMs sempre frescas.
  const trackingHandlers = useTrackingHandlers()

  return (
    <div className="bg-[#0A1929] min-h-screen text-white">
      {/* Header simples */}
      <header className="border-b border-white/8 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[#A0AEC0] hover:text-white text-sm font-sans inline-flex items-center gap-1.5">
            <span>←</span> Voltar
          </Link>
          <p className="text-[#D4A85A] font-bold text-sm uppercase tracking-wider">BarberMeta</p>
          <span className="w-12" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <span className="inline-block rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-3 py-1 text-xs font-bold text-[#D4A85A] uppercase tracking-wider mb-4">
            ⭐ Escolha sua oferta
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Qual versão é a sua?
          </h1>
          <p className="text-[#A0AEC0] text-base sm:text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
            Pagamento único · Sem mensalidade · 7 dias de garantia incondicional
          </p>
        </motion.div>

        {/* 2 cards lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">

          {/* ── Oferta 1: BarberMeta R$ 47 ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-white/15 bg-[#0F1F2D] p-6 sm:p-7 flex flex-col"
          >
            <div className="text-center mb-5">
              <p className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider mb-1">BarberMeta</p>
              <p className="text-[#A0AEC0] text-xs">pagamento único</p>
              <p className="text-5xl font-bold text-white leading-none mt-2">R$ 47</p>
            </div>

            <ul className="space-y-2 flex-1 mb-5">
              {bmInclui.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[#E2E8F0] text-sm">
                  <span className="text-[#22C55E] font-bold mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={URL_BM}
              id="cta-oferta-bm-47"
              target="_blank"
              rel="noopener noreferrer"
              {...trackingHandlers}
              className="gtm-cta gtm-cta-oferta cta-bm w-full text-center block rounded-xl border border-white/25 bg-transparent hover:bg-white/5 text-white font-bold py-3.5 text-base transition-colors"
            >
              Quero o BarberMeta — R$ 47
            </a>
            <p className="text-[11px] text-[#A0AEC0] text-center mt-2">Garantia de 7 dias</p>
          </motion.div>

          {/* ── Oferta 2: Combo R$ 67 ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="relative rounded-2xl border-2 border-[#D4A85A] bg-gradient-to-b from-[#0A1929] to-[#1A1410] p-6 sm:p-7 flex flex-col"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-[#D4A85A] text-[#0F1117] text-[11px] font-bold uppercase tracking-wider px-3 py-1 whitespace-nowrap">
              🔥 Mais Completo
            </div>

            <div className="text-center mb-5">
              <p className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider mb-1">Combo PLUS</p>
              <p className="text-[#A0AEC0] text-xs">pagamento único</p>
              <p className="text-5xl font-bold text-white leading-none mt-2">R$ 67</p>
              <p className="text-[#D4A85A] text-xs font-semibold mt-2">Só R$ 20 a mais — ganha 2 módulos premium</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
              <p className="text-[10px] text-[#A0AEC0] uppercase tracking-wider mb-2 text-center font-semibold">Tudo do BarberMeta +</p>
              <ul className="space-y-2">
                {comboExtra.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[#E2E8F0] text-sm">
                    <span className="text-[#D4A85A] font-bold mt-0.5 shrink-0">★</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={URL_COMBO}
              id="cta-oferta-combo-67"
              target="_blank"
              rel="noopener noreferrer"
              {...trackingHandlers}
              className="gtm-cta gtm-cta-oferta cta-combo w-full text-center block rounded-xl bg-[#D4A85A] hover:bg-[#E6CB8A] text-[#0F1117] font-bold py-3.5 text-base transition-colors mt-auto"
            >
              Quero o Combo PLUS — R$ 67
            </a>
            <p className="text-[11px] text-[#A0AEC0] text-center mt-2">Garantia de 7 dias</p>
          </motion.div>
        </div>

        {/* Por que escolher o Combo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[#D4A85A]/30 bg-[#0F1117] p-6 sm:p-8 mb-10"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
            Por que <span className="text-[#D4A85A]">99% dos donos escolhem o Combo</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="text-center">
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="font-bold text-sm mb-1">Cliente volta</h3>
              <p className="text-[#A0AEC0] text-xs leading-relaxed">
                Feedback Premiado faz o cliente avaliar, ganhar brinde e voltar pra usar. Conversão real.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold text-sm mb-1">Sabe quanto sobra</h3>
              <p className="text-[#A0AEC0] text-xs leading-relaxed">
                Controle Financeiro mostra caixa, contas e folha. Você sabe quanto sobra no mês — todo mês.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-bold text-sm mb-1">Só R$ 20 a mais</h3>
              <p className="text-[#A0AEC0] text-xs leading-relaxed">
                Por menos que 1 corte vc desbloqueia os 2 módulos pra sempre. Vitalício.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-5">
            Perguntas frequentes
          </h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {faq.map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 bg-[#0F1117] p-4 group">
                <summary className="cursor-pointer font-semibold text-sm text-white flex items-center justify-between gap-2 list-none">
                  <span>{f.q}</span>
                  <span className="text-[#D4A85A] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-[#A0AEC0] text-sm mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="text-center text-[#A0AEC0] text-xs sm:text-sm">
          <p className="mb-1">🔒 Pagamento seguro pela Hotmart</p>
          <p>7 dias de garantia incondicional · Sem mensalidade · Acesso vitalício</p>
        </div>

      </main>
    </div>
  )
}
