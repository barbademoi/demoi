import CTAButton from './CTAButton'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#07111F] px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#1E63E9]/20 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-32 h-80 w-80 rounded-full bg-[#F4B942]/15 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F4B942]/35 bg-[#F4B942]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#FFD16A] sm:text-xs">
            <span aria-hidden="true">✦</span>
            A ferramenta que coloca a equipe para agir
          </span>

          <h1 className="text-balance text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.65rem]">
            Faça sua equipe acompanhar as metas, se envolver{' '}
            <span className="text-[#F4B942]">e vender mais todos os dias.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:mt-6 sm:text-lg">
            O BarberMeta trabalha junto com a agenda que você já usa para transformar metas em ações e criar novas oportunidades durante o atendimento.
          </p>

          <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3">
            <CTAButton label="Quero vender mais com minha equipe" id="cta-hero-planos" gtmClass="gtm-cta-hero" />
            <p className="text-sm font-semibold text-[#B8C3D1]">Sistema completo · sem custo por barbeiro · garantia de 30 dias</p>
          </div>
        </div>
      </div>
    </section>
  )
}
