import Image from 'next/image'
import CTAButton from './CTAButton'

const sinais = [
  'Pagamento único',
  'Acesso vitalício',
  '7 dias de garantia',
]

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

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.03fr_.97fr] lg:gap-14">
        <div className="text-center lg:text-left">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F4B942]/35 bg-[#F4B942]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#FFD16A] sm:text-xs">
            <span aria-hidden="true">✦</span>
            Feito para donos de barbearia
          </span>

          <h1 className="text-balance text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.65rem]">
            Faça seus barbeiros{' '}
            <span className="text-[#F4B942]">venderem mais</span> — sem cobrar meta todo dia.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8C3D1] sm:mt-6 sm:text-lg lg:mx-0">
            Pense em uma <strong className="font-semibold text-white">planilha bonita, feita para o celular:</strong>{' '}
            cada barbeiro abre o próprio link e acompanha quanto vendeu, quanto falta para a meta e sua posição no ranking.
          </p>

          <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3 lg:mx-0 lg:items-start">
            <CTAButton label="Quero o BarberMeta — R$ 47" id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
            <p className="text-sm text-[#8FA0B3]">Sem mensalidade. Você paga uma vez e usa para sempre.</p>
          </div>

          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 lg:mx-0 lg:justify-start">
            {sinais.map((sinal) => (
              <li key={sinal} className="flex items-center gap-1.5 text-xs font-semibold text-[#D6DEE8] sm:text-sm">
                <span aria-hidden="true" className="text-emerald-400">✓</span>
                {sinal}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div aria-hidden="true" className="absolute inset-8 rounded-full bg-[#1E63E9]/20 blur-3xl" />
          <div className="relative mx-auto w-[76%] max-w-[310px] sm:w-[64%] lg:w-[62%]">
            <div className="overflow-hidden rounded-[34px] border-[7px] border-[#151A23] bg-[#111827] shadow-2xl shadow-black/60">
              <div aria-hidden="true" className="mx-auto h-5 w-24 rounded-b-2xl bg-[#151A23]" />
              <Image
                src="/prints/mobile-dashboard-hero.jpg"
                width={1320}
                height={2628}
                priority
                sizes="(max-width: 640px) 58vw, (max-width: 1024px) 310px, 300px"
                alt="Tela do barbeiro no BarberMeta com meta, ritmo e ranking"
                className="block h-auto w-full"
              />
            </div>
          </div>

          <div className="absolute left-0 top-[18%] max-w-[150px] rounded-2xl border border-white/10 bg-[#101B2B]/95 p-3 shadow-xl backdrop-blur sm:left-4 sm:max-w-[180px] sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8FA0B3] sm:text-xs">O barbeiro vê</p>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">Quanto falta pra meta</p>
          </div>

          <div className="absolute bottom-[16%] right-0 max-w-[150px] rounded-2xl border border-emerald-400/25 bg-[#0D211C]/95 p-3 shadow-xl backdrop-blur sm:right-3 sm:max-w-[180px] sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:text-xs">Resultado</p>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">O time se movimenta</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-6xl rounded-2xl border border-[#F4B942]/25 bg-[#F4B942]/[0.07] p-4 sm:mt-16 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 text-2xl">🎥</span>
          <div>
            <p className="font-bold text-white">O sistema vem com 8 aulas que valem ouro.</p>
            <p className="mt-1 text-sm leading-relaxed text-[#B8C3D1]">Eu mostro, na prática, como faço meu time vender mais usando o BarberMeta.</p>
          </div>
        </div>
        <a href="#como-funciona" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#FFD16A] hover:text-white sm:mt-0 sm:shrink-0">
          Ver como funciona ↓
        </a>
      </div>
    </section>
  )
}
