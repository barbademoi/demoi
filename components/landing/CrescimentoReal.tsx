import Image from 'next/image'
import CTAButton from './CTAButton'
import LandingIcon from './LandingIcon'
import CarouselNudge from './CarouselNudge'

const sinais = [
  { icon: 'chart' as const, texto: 'Comparação entre meses fechados', cor: 'text-[#64E3BA]', fundo: 'bg-[#64E3BA]/10' },
  { icon: 'check' as const, texto: 'Números registrados no sistema', cor: 'text-[#74A4FF]', fundo: 'bg-[#1E63E9]/15' },
  { icon: 'team' as const, texto: 'Imagem publicada com autorização', cor: 'text-[#FFD16A]', fundo: 'bg-[#F4B942]/10' },
]

const resultados = [
  { src: '/prints/crescimento/andrades-barbershop.png', nome: "Andrade's Barbershop" },
  { src: '/prints/crescimento/conexao-barbers.png', nome: 'Conexão Barbers' },
  { src: '/prints/crescimento/demoi-barbearia.png', nome: 'Demôi Barbearia' },
  { src: '/prints/crescimento/grupo-facility.png', nome: 'Grupo Facility' },
  { src: '/prints/crescimento/kane-barber-club.png', nome: 'Kane Barber Club' },
  { src: '/prints/crescimento/legadum-barbearia.png', nome: 'Legadum Barbearia' },
  { src: '/prints/crescimento/ricci-barbearia.png', nome: 'Ricci Barbearia' },
  { src: '/prints/crescimento/st-bryts-barber-club.png', nome: 'St. Bryts Barber Club' },
  { src: '/prints/crescimento/suten-barbearia.png', nome: 'Suten Barbearia' },
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
            Nove operações reais, seus faturamentos e a evolução registrada entre meses fechados no BarberMeta.
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

        <figure className="mt-6 overflow-hidden rounded-[26px] border border-white/15 bg-[#101319] py-4 shadow-2xl shadow-black/50 sm:py-5">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.035] px-4 py-3 sm:px-5">
            <span className="text-xs font-bold text-white">Crescimento real de barbearias que usam o BarberMeta</span>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#64E3BA]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64E3BA] shadow-[0_0_10px_#64E3BA]" aria-hidden="true" />
              Rolagem automática
            </span>
          </figcaption>

          <div
            className="crescimento-carousel relative mt-4"
            aria-label="Resultados de crescimento de nove barbearias que usam o BarberMeta"
          >
            <ul className="crescimento-carousel-track">
              {[...resultados, ...resultados].map((resultado, index) => {
                const repetido = index >= resultados.length

                return (
                  <li
                    key={`${resultado.nome}-${index}`}
                    className="crescimento-carousel-card"
                    aria-hidden={repetido ? true : undefined}
                  >
                    <Image
                      src={resultado.src}
                      width={1080}
                      height={1350}
                      alt={repetido ? '' : `Crescimento real da ${resultado.nome} registrado no BarberMeta`}
                      sizes="(max-width: 640px) 76vw, 320px"
                      className="block h-auto w-full rounded-[20px]"
                      priority={index < 2}
                    />
                  </li>
                )
              })}
            </ul>
            <CarouselNudge className="carousel-nudge-y-center right-3 top-1/2 sm:right-5" />
          </div>
        </figure>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B3]">
          Passe o mouse ou toque e segure para pausar
        </p>

        <div className="mt-7 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#F4B942]/25 bg-gradient-to-r from-[#F4B942]/10 via-[#1E63E9]/10 to-[#64E3BA]/10 p-5 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="text-lg font-bold text-white">Sua equipe vê o caminho. Você acompanha a evolução.</p>
            <p className="mt-1 text-sm leading-relaxed text-[#B8C3D1]">Aplique com sua equipe e acompanhe a evolução dentro do sistema.</p>
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
