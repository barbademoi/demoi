'use client'

import { CHECKOUT_ANUAL_UNICO_URL, PRECO_ANUAL_UNICO } from '@/lib/checkout'
import { trackAddToCart } from '@/lib/pixel'
import { useTrackingHandlers } from '@/lib/utms'

/**
 * A OFERTA PÚBLICA: 1 ano de acesso completo por R$ 97, pagamento único.
 *
 * Saiu a grade de dois planos de assinatura. Não porque a assinatura tenha
 * acabado — quem já assina continua sendo cobrado e atendido normalmente —
 * mas porque a página vende UMA coisa agora, e escolher entre planos é um
 * trabalho que a página passava pro visitante justamente no momento em que ele
 * já tinha decidido comprar.
 *
 * "Pagamento único" aparece três vezes de propósito: no selo, no preço e
 * embaixo do botão. É a informação que evita o medo de assinatura que não se
 * consegue cancelar — e é ela que faz o R$ 97 parecer o que é.
 */

const INCLUSO = [
  'Metas por barbeiro e meta coletiva',
  'Ranking, campanhas e premiação',
  'Brindoleta — a roleta de brindes no QR Code',
  'Financeiro da barbearia',
  'Feedback Premiado dos clientes',
  'Link individual para cada barbeiro',
  '8 aulas práticas e comunidade no WhatsApp',
]

export default function Preco() {
  const trackingHandlers = useTrackingHandlers()

  return (
    <section id="preco" className="scroll-mt-20 bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">
            Pagamento único · garantia de 30 dias
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">
            Acesso completo por 1 ano.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#59677A] sm:text-lg">
            Você paga uma vez e usa o BarberMeta inteiro por 12 meses. Sem mensalidade,
            sem cobrança automática, sem plano pra escolher.
          </p>
        </div>

        <article className="overflow-hidden rounded-3xl border-2 border-[#D7A63E] bg-[#101828] text-white shadow-2xl shadow-[#101828]/20">
          <div className="p-7 sm:p-9">
            <span className="inline-flex rounded-full bg-verde-acao px-3 py-1 text-[10px] font-black uppercase tracking-wider text-carvao">
              Tudo incluso
            </span>

            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="text-6xl font-bold leading-none">R$ {PRECO_ANUAL_UNICO}</p>
              <p className="pb-1.5 text-base font-semibold text-[#9DACBD]">à vista, por 1 ano</p>
            </div>
            <p className="mt-3 inline-flex rounded-lg bg-verde-acao/12 px-3 py-2 text-sm font-bold text-verde-acao">
              Menos de R$ 9 por mês — e não vira mensalidade
            </p>

            <ul className="mt-7 space-y-2.5">
              {INCLUSO.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#E4EAF2]">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-verde-acao">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-bold text-verde-acao">✓ Garantia de reembolso por 30 dias</p>
          </div>

          <div className="border-t border-white/10 bg-white/[0.035] p-6 sm:px-9 sm:py-7">
            <a
              href={CHECKOUT_ANUAL_UNICO_URL}
              id="cta-preco-anual-unico"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAddToCart('anual_unico', PRECO_ANUAL_UNICO)}
              {...trackingHandlers}
              className="gtm-cta gtm-cta-preco flex min-h-14 w-full items-center justify-center rounded-xl bg-[#F4B942] px-5 py-4 text-center text-base font-bold text-[#101828] transition-colors hover:bg-[#FFD16A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4B942]"
            >
              Quero 1 ano por R$ {PRECO_ANUAL_UNICO}
            </a>
            <p className="mt-3 text-center text-xs text-[#9DACBD]">
              Pagamento único · sem renovação automática · garantia de 30 dias
            </p>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-[#667384]">
          Pagamento processado com segurança pela Hotmart. Se não gostar dentro de 30 dias,
          você recebe 100% do investimento de volta.
        </p>
      </div>
    </section>
  )
}
