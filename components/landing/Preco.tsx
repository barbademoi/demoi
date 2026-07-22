'use client'

import { useTrackingHandlers } from '@/lib/utms'

const URL_BM = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'
const URL_COMBO = 'https://pay.hotmart.com/K106318479K'

const inclusoBM = ['Acesso vitalício', 'Atualizações grátis', 'Acesso pra equipe inteira', 'Cards prontos pra WhatsApp', 'Suporte por email']
const inclusoCombo = ['TUDO do BarberMeta', '+ Feedback Premiado (brindes + Google)', '+ Controle Financeiro completo', 'Caixa, contas a pagar e receber', 'Folha da equipe (auto-sincroniza)', 'Quanto sobra no mês']

export default function Preco() {
  const trackingHandlers = useTrackingHandlers()

  return (
    <section id="preco" className="scroll-mt-20 bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Oferta</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">BarberMeta por pagamento único.</h2>
          <p className="mt-4 text-base text-[#A0AEC0] sm:text-lg">Sem mensalidade. Sem cobrança recorrente. Sem surpresa.</p>
        </div>

        <div className="grid items-start gap-5 md:grid-cols-2">
          <article className="flex flex-col items-center gap-5 rounded-3xl border border-white/15 bg-[#0F1F2D] p-7 sm:p-8">
            <div className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">BarberMeta</p>
              <p className="mb-1 text-xs text-[#A0AEC0]">pagamento único</p>
              <p className="text-5xl font-bold leading-none text-white">R$ 47</p>
            </div>
            <ul className="w-full space-y-2">
              {inclusoBM.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#E2E8F0]"><span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-[#22C55E]">✓</span><span>{item}</span></li>
              ))}
            </ul>
            <a href={URL_BM} id="cta-preco-bm-47" target="_blank" rel="noopener noreferrer" {...trackingHandlers} className="gtm-cta gtm-cta-preco cta-bm w-full rounded-xl border border-white/25 bg-transparent px-5 py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-white/5">Quero o BarberMeta — R$ 47</a>
            <p className="-mt-1 text-xs text-[#A0AEC0]">Garantia incondicional de 7 dias</p>
          </article>

          <article className="relative flex flex-col items-center gap-5 rounded-3xl border-2 border-[#D4A85A] bg-gradient-to-b from-[#0F1F2D] to-[#1A1410] p-7 shadow-2xl shadow-[#D4A85A]/20 sm:p-8 md:-translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#D4A85A] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F1117]">⭐ Mais escolhido</div>
            <div className="text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#D4A85A]">BarberMeta + Financeiro</p>
              <p className="mb-1 text-xs text-[#A0AEC0]">pagamento único</p>
              <p className="text-5xl font-bold leading-none text-white">R$ 67</p>
              <p className="mt-2 text-xs font-semibold text-[#D4A85A]">Metas + Feedback Premiado + Financeiro completo — por R$ 20 a mais</p>
            </div>
            <ul className="w-full space-y-2">
              {inclusoCombo.map((item, index) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#E2E8F0]"><span aria-hidden="true" className={`mt-0.5 shrink-0 font-bold ${index < 3 ? 'text-[#D4A85A]' : 'text-[#22C55E]'}`}>{index < 3 ? '★' : '✓'}</span><span className={index < 3 ? 'font-semibold' : ''}>{item}</span></li>
              ))}
            </ul>
            <a href={URL_COMBO} id="cta-preco-combo-67" target="_blank" rel="noopener noreferrer" {...trackingHandlers} className="gtm-cta gtm-cta-preco cta-combo w-full rounded-xl bg-[#D4A85A] px-5 py-3.5 text-center text-base font-bold text-[#0F1117] transition-colors hover:bg-[#E6CB8A]">Quero o Combo — R$ 67</a>
            <p className="-mt-1 text-xs text-[#A0AEC0]">Garantia incondicional de 7 dias</p>
          </article>
        </div>
      </div>
    </section>
  )
}
