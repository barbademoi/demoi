sed: --: No such file or directory
'use client'

import { useTrackingHandlers } from '@/lib/utms'

const URL_BM = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'
const URL_COMBO = 'https://pay.hotmart.com/K106318479K'

const inclusoBM = [
  'Acesso vitalício ao BarberMeta',
  'Equipe inteira, sem custo por usuário',
  '8 aulas práticas de uso e vendas',
  'Atualizações gratuitas',
  'Cards prontos para WhatsApp',
  'Suporte direto',
]

const inclusoCombo = [
  'BarberMeta completo',
  'Feedback Premiado',
  'Controle Financeiro completo',
]

export default function Preco() {
  const trackingHandlers = useTrackingHandlers()

  return (
    <section id="preco" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Oferta simples</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">Comece hoje. Sem adicionar outra mensalidade à barbearia.</h2>
          <p className="mt-4 text-base text-[#59677A] sm:text-lg">Um pagamento. Acesso para a equipe inteira.</p>
        </div>

        <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-[#182235] bg-[#101828] text-white shadow-2xl shadow-[#101828]/20">
          <div className="grid sm:grid-cols-[1fr_.9fr]">
            <div className="border-b border-white/10 p-7 sm:border-b-0 sm:border-r sm:p-9">
              <span className="inline-flex rounded-full bg-[#F4B942] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#101828]">BarberMeta completo</span>
              <p className="mt-6 text-sm text-[#9DACBD]">pagamento único</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-5xl font-bold leading-none sm:text-6xl">R$ 47</p>
                <p className="pb-1 text-sm text-[#9DACBD]">uma vez</p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#C6D0DD]">Se o sistema não fizer sentido para sua barbearia, você tem 7 dias para pedir o reembolso.</p>
            </div>

            <div className="p-7 sm:p-9">
              <p className="mb-4 text-sm font-bold text-white">Tudo que está incluído:</p>
              <ul className="space-y-2.5">
                {inclusoBM.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#D6DEE8]">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.035] p-6 sm:px-9 sm:py-7">
            <a href={URL_BM} id="cta-preco-bm-47" target="_blank" rel="noopener noreferrer" {...trackingHandlers} className="gtm-cta gtm-cta-preco cta-bm flex min-h-14 w-full items-center justify-center rounded-xl bg-[#F4B942] px-5 py-4 text-center text-base font-bold text-[#101828] transition-colors hover:bg-[#FFD16A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4B942] sm:text-lg">
              Quero o BarberMeta por R$ 47
            </a>
            <p className="mt-3 text-center text-xs text-[#9DACBD]">Compra processada pela Hotmart · garantia de 7 dias</p>
          </div>
        </article>

        <article className="mx-auto mt-5 flex max-w-3xl flex-col gap-5 rounded-2xl border border-[#E2E6EA] bg-[#F8F9FA] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A5A0D]">Opção com recursos extras</p>
            <h3 className="mt-1 text-lg font-bold text-[#101828]">BarberMeta + Financeiro · R$ 67</h3>
            <p className="mt-2 text-sm text-[#667384]">{inclusoCombo.join(' + ')}</p>
          </div>
          <a href={URL_COMBO} id="cta-preco-combo-67" target="_blank" rel="noopener noreferrer" {...trackingHandlers} className="gtm-cta gtm-cta-preco cta-combo inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#CBD2DA] bg-white px-5 py-3 text-sm font-bold text-[#101828] transition-colors hover:border-[#AAB4C0] hover:bg-[#F2F4F6]">
            Ver combo de R$ 67
          </a>
        </article>
      </div>
    </section>
  )
}
