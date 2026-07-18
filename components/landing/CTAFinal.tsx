import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function CTAFinal() {
  return (
    <section className="overflow-hidden bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:gap-12">
        <div className="flex-1 text-center lg:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Comece agora</p>
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            No próximo mês, cada barbeiro pode acompanhar a própria meta.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#A0AEC0] sm:text-lg">
            Por R$ {PRECO}, uma vez para sempre, você tira a meta do WhatsApp e coloca o progresso na mão da equipe.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
            <CTAButton label={`Quero o BarberMeta agora — R$ ${PRECO}`} id="cta-final-oferta" gtmClass="gtm-cta-final" />
            <p className="text-sm text-[#A0AEC0]">7 dias de garantia · Reembolso 100% · Sem pegadinha</p>
          </div>
        </div>

        <div className="w-48 shrink-0 sm:w-56 lg:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prints/foto-apontando.png" width="576" height="720" alt="Carlos Henrique recomenda o BarberMeta" className="h-auto w-full rounded-2xl shadow-2xl" loading="lazy" />
        </div>
      </div>
    </section>
  )
}
