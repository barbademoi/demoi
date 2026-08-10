'use client'

import {
  CHECKOUT_ANUAL_URL,
  CHECKOUT_MENSAL_URL,
  PRECO_ANUAL,
  PRECO_MENSAL,
} from '@/lib/checkout'
import { trackInitiateCheckout } from '@/lib/pixel'
import { useTrackingHandlers } from '@/lib/utms'

const incluso = [
  'Metas, ranking e acompanhamento da equipe',
  'Brindoleta completa com QR Code por profissional',
  'Controle financeiro e folha da equipe',
  'Feedback Premiado e avaliações de clientes',
  'Cards, mensagens e recursos com IA',
  'Aulas práticas e atualizações do sistema',
  'Comunidade ativa no WhatsApp',
  'Suporte humanizado',
]

export default function Preco() {
  const trackingHandlers = useTrackingHandlers()

  return (
    <section id="preco" className="scroll-mt-20 bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Assinatura completa</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">Todos os módulos. Você escolhe como prefere pagar.</h2>
          <p className="mt-4 text-base text-[#59677A] sm:text-lg">O acesso é o mesmo nos dois planos. O anual entrega a melhor economia.</p>
        </div>

        <div className="mx-auto mb-7 grid max-w-4xl gap-3 sm:grid-cols-2">
          {incluso.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-[#DDE1E6] bg-white px-4 py-3 text-sm leading-relaxed text-[#344054] shadow-sm">
              <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-emerald-600">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
          <article className="flex flex-col overflow-hidden rounded-3xl border border-[#D6DAE0] bg-white shadow-xl shadow-[#101828]/10">
            <div className="flex-1 p-7 sm:p-9">
              <span className="inline-flex rounded-full bg-[#EEF2F6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#344054]">Flexibilidade</span>
              <h3 className="mt-5 text-2xl font-bold text-[#101828]">Plano mensal</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#667384]">Ideal para começar com uma cobrança menor e renovar mês a mês.</p>
              <div className="mt-7 flex items-end gap-2">
                <p className="text-5xl font-bold leading-none text-[#101828]">R$ 34,90</p>
                <p className="pb-1 text-sm font-semibold text-[#667384]">/mês</p>
              </div>
            </div>
            <div className="border-t border-[#E7EAEE] bg-[#F8F9FA] p-6 sm:px-9 sm:py-7">
              <a
                href={CHECKOUT_MENSAL_URL}
                id="cta-preco-mensal"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInitiateCheckout(PRECO_MENSAL)}
                {...trackingHandlers}
                className="gtm-cta gtm-cta-preco flex min-h-14 w-full items-center justify-center rounded-xl bg-[#101828] px-5 py-4 text-center text-base font-bold text-white transition-colors hover:bg-[#243247] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#101828]"
              >
                Assinar plano mensal
              </a>
              <p className="mt-3 text-center text-xs text-[#667384]">R$ 34,90 por mês · cobrança recorrente</p>
            </div>
          </article>

          <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-[#D7A63E] bg-[#101828] text-white shadow-2xl shadow-[#101828]/20">
            <div className="absolute right-5 top-5 rounded-full bg-[#F4B942] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#101828]">Melhor valor</div>
            <div className="flex-1 p-7 sm:p-9">
              <span className="inline-flex rounded-full border border-[#F4B942]/30 bg-[#F4B942]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FFD16A]">Economize R$ 121,80</span>
              <h3 className="mt-5 text-2xl font-bold">Plano anual</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C6D0DD]">A melhor condição para quem já quer aplicar o BarberMeta durante o ano.</p>
              <div className="mt-7 flex items-end gap-2">
                <p className="text-5xl font-bold leading-none">R$ 297</p>
                <p className="pb-1 text-sm font-semibold text-[#9DACBD]">/ano à vista</p>
              </div>
              <p className="mt-3 inline-flex rounded-lg bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-300">Equivale a R$ 24,75 por mês</p>
            </div>
            <div className="border-t border-white/10 bg-white/[0.035] p-6 sm:px-9 sm:py-7">
              <a
                href={CHECKOUT_ANUAL_URL}
                id="cta-preco-anual"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInitiateCheckout(PRECO_ANUAL)}
                {...trackingHandlers}
                className="gtm-cta gtm-cta-preco flex min-h-14 w-full items-center justify-center rounded-xl bg-[#F4B942] px-5 py-4 text-center text-base font-bold text-[#101828] transition-colors hover:bg-[#FFD16A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4B942]"
              >
                Assinar plano anual
              </a>
              <p className="mt-3 text-center text-xs text-[#9DACBD]">Parcelamento disponível com acréscimo no checkout</p>
            </div>
          </article>
        </div>

        <p className="mt-6 text-center text-xs text-[#667384]">Pagamento e renovação processados com segurança pela Hotmart. Acesso liberado após a confirmação da compra.</p>

        <aside className="mx-auto mt-7 max-w-4xl rounded-2xl border border-[#B77916]/25 bg-[#FFF8E7] px-5 py-4 text-sm leading-relaxed text-[#6D4B12]">
          <strong>Já é cliente vitalício?</strong> Nada muda no seu plano: seu acesso atual continua preservado. Se quiser adicionar um módulo que não faz parte da sua licença, ele continua disponível para compra separada dentro do sistema.
        </aside>
      </div>
    </section>
  )
}
