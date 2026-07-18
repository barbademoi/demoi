sed: --: No such file or directory
import CTAButton from './CTAButton'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0A1929] px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:min-h-[760px] lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4A85A]/40 bg-[#D4A85A]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D4A85A]">
            <span aria-hidden="true">🎯</span>
            Metas que cada barbeiro acompanha sozinho
          </span>

          <h1 className="text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            Cada barbeiro acompanha a própria meta pelo celular.{' '}
            <span className="text-[#D4A85A]">Sem você precisar cobrar.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#A0AEC0] sm:text-lg lg:mx-0">
            Cada um recebe um link próprio, sem senha, e vê comissão, ritmo,
            metas e posição no ranking. Quem está atrás, acelera sozinho.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
            <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
            <p className="text-sm text-[#A0AEC0]">Acesso vitalício · Sem mensalidade · 7 dias de garantia</p>
          </div>

          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left lg:mx-0">
            <span aria-hidden="true" className="mt-0.5 shrink-0">ℹ️</span>
            <p className="text-sm leading-relaxed text-[#A0AEC0]">
              <strong className="text-white">Não precisa trocar seu sistema de gestão.</strong>{' '}
              Você continua usando o que já usa e lança os números no BarberMeta em poucos minutos.
            </p>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[360px] justify-center pb-20 sm:pb-24 lg:max-w-[420px]">
          <div aria-hidden="true" className="absolute inset-8 rounded-full bg-[#D4A85A]/20 blur-3xl" />
          <div className="relative z-10 w-full max-w-[270px] sm:max-w-[310px]">
            <div className="relative overflow-hidden rounded-[40px] border-[8px] border-[#0F1117] bg-[#0F1117] shadow-2xl shadow-black/60">
              <div aria-hidden="true" className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#0F1117]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/mobile-dashboard-hero.jpg"
                alt="Dashboard do BarberMeta no celular mostrando a meta coletiva"
                className="block h-auto w-full"
                fetchPriority="high"
              />
            </div>

            <div className="absolute -bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center sm:-bottom-24">
              <div className="h-[126px] w-[126px] overflow-hidden rounded-full border-[5px] border-emerald-400 bg-[#0F1F2D] shadow-2xl shadow-emerald-500/30 sm:h-[150px] sm:w-[150px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/prints/carlos-hero.jpg" alt="" className="block h-full w-full object-cover" loading="lazy" />
              </div>
              <p className="mt-3 whitespace-nowrap text-sm font-bold text-white sm:text-base">Carlos Henrique</p>
              <p className="whitespace-nowrap text-[11px] font-semibold text-[#D4A85A] sm:text-xs">criador do BarberMeta</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
