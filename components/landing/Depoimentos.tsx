import Image from 'next/image'
import CarouselNudge from './CarouselNudge'

const depoimentos = [
  { src: '/prints/feedback-1.png', alt: 'Depoimento real sobre metas e participação da equipe no BarberMeta' },
  { src: '/prints/feedback-2.png', alt: 'Depoimento real de cliente estudando o BarberMeta' },
  { src: '/prints/feedback-3.png', alt: 'Depoimento real de cliente com a meta ouro atingida' },
  { src: '/prints/feedback-4.png', alt: 'Depoimento real sobre o engajamento da equipe' },
  { src: '/prints/feedback-5.png', alt: 'Depoimento real sobre a facilidade de uso do BarberMeta' },
]

export default function Depoimentos() {
  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Resultado real</p>
            <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">Quando a equipe acompanha o próprio resultado, ela se movimenta.</h2>
            <p className="mt-4 text-base leading-relaxed text-[#59677A]">O BarberMeta já faz parte da rotina de mais de 600 barbearias.</p>
          </div>

          <figure className="rounded-3xl border border-[#E6D2A7] bg-[#FFF9EC] p-6 sm:p-8">
            <div className="mb-4 text-3xl text-[#B77916]" aria-hidden="true">“</div>
            <blockquote className="text-xl font-bold leading-snug text-[#101828] sm:text-2xl">
              Primeiro mês usando o BarberMeta: batemos a meta ouro. R$ 60.016 no mês.
            </blockquote>
            <figcaption className="mt-4 text-sm font-bold text-[#9A650F]">Geison · dono de barbearia</figcaption>
          </figure>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-6xl">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:gap-5 sm:px-6">
          {depoimentos.map((depoimento) => (
            <figure key={depoimento.src} className="relative w-[68vw] max-w-[235px] shrink-0 snap-center overflow-hidden rounded-2xl border border-[#E2E6EA] bg-[#F7F8FA] shadow-lg shadow-black/10">
              <Image src={depoimento.src} width={1320} height={2585} alt={depoimento.alt} sizes="235px" className="block h-auto w-full" />
            </figure>
          ))}
        </div>
        <CarouselNudge className="carousel-nudge-y-center right-3 top-1/2 sm:right-5" />
      </div>
      <p className="mt-3 px-4 text-center text-xs text-[#748093]">Mensagens publicadas com autorização dos clientes.</p>
    </section>
  )
}
