'use client'

import { motion } from 'framer-motion'
import { trackInitiateCheckout } from '@/lib/pixel'

const URL_BM = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'
const URL_COMBO = 'https://pay.hotmart.com/K106318479K'

const inclusoBM = [
  'Acesso vitalício',
  'Atualizações grátis',
  'Acesso pra equipe inteira',
  'Cards prontos pra WhatsApp',
  'Suporte por email',
]
const inclusoCombo = [
  'TUDO do BarberMeta',
  '+ Feedback Premiado (brindes + Google)',
  '+ Controle Financeiro completo',
  'Caixa, contas a pagar e receber',
  'Folha da equipe (auto-sincroniza)',
  'Quanto sobra no mês',
]

function btnClick(price: number, url: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    trackInitiateCheckout(price)
    setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), 200)
  }
}

export default function Preco() {
  return (
    <section id="preco" className="bg-[#0F1F2D] py-16 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
        >
          Escolha o seu —{' '}
          <span className="text-[#D4A85A]">pagamento único.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-[#A0AEC0] text-lg mb-12"
        >
          Sem mensalidade. Sem cobrança recorrente. Sem surpresa.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Oferta 1: BarberMeta R$ 47 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-white/15 bg-[#0A1929] p-7 sm:p-8 flex flex-col items-center gap-5"
          >
            <div className="text-center">
              <p className="text-[#A0AEC0] text-xs font-semibold uppercase tracking-wider mb-2">BarberMeta</p>
              <p className="text-[#A0AEC0] text-xs mb-1">pagamento único</p>
              <p className="text-5xl font-bold text-white leading-none">R$ 47</p>
            </div>

            <ul className="space-y-2 w-full">
              {inclusoBM.map(item => (
                <li key={item} className="flex items-start gap-2 text-[#E2E8F0] text-sm">
                  <span className="text-[#22C55E] font-bold mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={URL_BM}
              id="cta-preco-bm-47"
              onClick={btnClick(47, URL_BM)}
              className="gtm-cta gtm-cta-preco cta-bm w-full text-center rounded-xl border border-white/25 bg-transparent hover:bg-white/5 text-white font-bold px-5 py-3.5 text-base transition-colors"
            >
              Quero o BarberMeta — R$ 47
            </a>

            <p className="text-xs text-[#A0AEC0] -mt-1">Garantia incondicional de 7 dias</p>
          </motion.div>

          {/* ── Oferta 2: Combo R$ 67 (destaque) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative rounded-2xl border-2 border-[#D4A85A] bg-gradient-to-b from-[#0A1929] to-[#1A1410] p-7 sm:p-8 flex flex-col items-center gap-5"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-[#D4A85A] text-[#0F1117] text-[11px] font-bold uppercase tracking-wider px-3 py-1">
              🔥 Mais Completo
            </div>

            <div className="text-center">
              <p className="text-[#D4A85A] text-xs font-semibold uppercase tracking-wider mb-2">BarberMeta + Financeiro</p>
              <p className="text-[#A0AEC0] text-xs mb-1">pagamento único</p>
              <p className="text-5xl font-bold text-white leading-none">R$ 67</p>
              <p className="text-[#D4A85A] text-xs font-semibold mt-2">Economize R$ 9,90 vs comprar separado</p>
            </div>

            <ul className="space-y-2 w-full">
              {inclusoCombo.map((item, i) => (
                <li key={item} className="flex items-start gap-2 text-[#E2E8F0] text-sm">
                  <span className={`font-bold mt-0.5 shrink-0 ${i < 3 ? 'text-[#D4A85A]' : 'text-[#22C55E]'}`}>
                    {i < 3 ? '★' : '✓'}
                  </span>
                  <span className={i < 3 ? 'font-semibold' : ''}>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={URL_COMBO}
              id="cta-preco-combo-67"
              onClick={btnClick(67, URL_COMBO)}
              className="gtm-cta gtm-cta-preco cta-combo w-full text-center rounded-xl bg-[#D4A85A] hover:bg-[#E6CB8A] text-[#0F1117] font-bold px-5 py-3.5 text-base transition-colors"
            >
              Quero o Combo — R$ 67
            </a>

            <p className="text-xs text-[#A0AEC0] -mt-1">Garantia incondicional de 7 dias</p>
          </motion.div>

        </div>

      </div>
    </section>
  )
}
