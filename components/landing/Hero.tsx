import CTAButton from './CTAButton'

export default function Hero() {
  return (
    // O topo é curto porque o hero deixou de ser a primeira seção: quem abre a
    // landing vê o vídeo antes, e a folga do menu fixo já é dada lá. Padding de
    // menu aqui viraria um vão vazio entre o vídeo e a headline — e empurraria
    // o CTA pra fora da primeira dobra no celular.
    <section className="relative overflow-hidden bg-carvao px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-vermelho-poste/12 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-32 h-80 w-80 rounded-full bg-latao/15 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F4B942]/35 bg-[#F4B942]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#FFD16A] sm:text-xs">
            <span aria-hidden="true">🔥</span>
            +600 barbearias já usam
          </span>

          <h1 className="text-balance text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.65rem]">
            Sua equipe vende mais quando enxerga a própria meta.{' '}
            <span className="text-latao">Sem você precisar cobrar.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:mt-6 sm:text-lg">
O BarberMeta trabalha junto com a agenda que você já usa e transforma a meta em ação no dia a dia.
          </p>

          <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3">
            <CTAButton label="Quero vender mais com minha equipe" id="cta-hero-planos" gtmClass="gtm-cta-hero" />
            <p className="text-sm font-semibold text-[#B8C3D1]">Sistema completo · garantia de 30 dias</p>
          </div>
        </div>
      </div>
    </section>
  )
}
