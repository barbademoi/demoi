import Image from 'next/image'
import CTAButton from './CTAButton'
import LandingIcon from './LandingIcon'

const sinais = [
  { icon: 'chart' as const, texto: 'Comparação entre meses fechados', cor: 'text-[#64E3BA]', fundo: 'bg-[#64E3BA]/10' },
  { icon: 'check' as const, texto: 'Números registrados no sistema', cor: 'text-[#74A4FF]', fundo: 'bg-[#1E63E9]/15' },
  { icon: 'team' as const, texto: 'Imagem publicada com autorização', cor: 'text-[#FFD16A]', fundo: 'bg-[#F4B942]/10' },
]

export default function CrescimentoReal() {
  return (
    <section className="relative overflow-hidden bg-[#0B0D13] px-4 py-16 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      <div aria-hidden="true" className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#1E63E9]/20 blur-[120px]" />
      <div aria-hidden="true" className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#13C58B]/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#64E3BA]/30 bg-[#64E3BA]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#64E3BA]">
              <span className="h-2 w-2 rounded-full bg-[#64E3BA] shadow-[0_0_12px_#64E3BA]" aria-hidden="true" />
              Dados reais do BarberMeta
            </span>
            <h2 className="mt-5 max-w-3xl text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Crescimento que o dono consegue{' '}
              <span className="text-[#64E3BA]">ver nos próprios números.</span>
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            Este é um recorte real do painel administrativo: seis operações, seus faturamentos e a evolução registrada entre meses fechados.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {sinais.map((sinal) => (
            <div key={sinal.texto} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sinal.fundo} ${sinal.cor}`}>
                <LandingIcon name={sinal.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold leading-snug text-white">{sinal.texto}</span>
            </div>
          ))}
        </div>

        <figure className="mt-6 overflow-hidden rounded-[26px] border border-white/15 bg-[#101319] shadow-2xl shadow-black/50">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.035] px-4 py-3 sm:px-5">
            <span className="text-xs font-bold text-white">Painel de crescimento das barbearias</span>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#64E3BA]">Imagem real · sem simulação</span>
          </figcaption>
          <div className="overflow-x-auto" aria-label="Imagem real do crescimento das barbearias; no celular, arraste horizontalmente para ver todos os dados">
            <Image
              src="/prints/crescimento-real-barbearias.png"
              width={2042}
              height={1300}
              alt="Painel real do BarberMeta mostrando o crescimento de seis barbearias entre meses fechados"
              sizes="(max-width: 767px) 760px, 100vw"
              className="block h-auto min-w-[760px] w-full md:min-w-0"
            />
          </div>
        </figure>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B3] md:hidden">← Arraste para conferir todos os números →</p>

        <div className="mt-7 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#F4B942]/25 bg-gradient-to-r from-[#F4B942]/10 via-[#1E63E9]/10 to-[#64E3BA]/10 p-5 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="text-lg font-bold text-white">Sua equipe vê o caminho. Você acompanha a evolução.</p>
            <p className="mt-1 text-sm leading-relaxed text-[#B8C3D1]">Comece por menos que um corte por mês e tenha 30 dias de garantia.</p>
          </div>
          <CTAButton label="Quero aplicar na minha barbearia" id="cta-crescimento-planos" gtmClass="gtm-cta-crescimento" />
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#718095] sm:text-xs">
          Resultados variam conforme equipe, operação e execução. A comparação exibida não representa promessa de resultado futuro.
        </p>
      </div>
    </section>
  )
}
