import Image from 'next/image'
import CarouselNudge from './CarouselNudge'

/**
 * PRINTS DAS CONVERSAS.
 *
 * As dimensões são as REAIS de cada arquivo, uma a uma. Antes havia um
 * 1320x2585 fixo pra todo mundo: com prints de alturas diferentes, o navegador
 * reservava o espaço errado e a página dava um pulo quando cada imagem
 * carregava.
 *
 * Os telefones que apareciam nos prints de grupo do WhatsApp foram borrados
 * antes de subir. Print de conversa com o número de um cliente vira spam e
 * golpe na conta dele — e a força do depoimento está no texto, não no
 * telefone. Os prints de Instagram mostram só o @, que já é público.
 */
const depoimentos = [
  { src: '/prints/feedback-6.png', w: 1320, h: 2868, alt: 'Dono relata na comunidade que o barbeiro que fazia R$ 250 de serviço extra passou a fazer R$ 998' },
  { src: '/prints/feedback-7.png', w: 1320, h: 2610, alt: 'Continuação do relato: os três barbeiros citados eram os mais fracos em vendas, de um time de nove' },
  { src: '/prints/feedback-9.png', w: 1320, h: 2682, alt: 'Dono conta que fez uma reunião faltando R$ 8.700 para a meta e o time fechou o mês' },
  { src: '/prints/feedback-10.png', w: 1320, h: 2492, alt: 'Print da meta coletiva batida: R$ 60.287 no mês, com todos os tiers atingidos' },
  { src: '/prints/feedback-8.png', w: 1320, h: 2731, alt: 'Cliente com dois dias de uso elogiando as funcionalidades e o contato direto com o dono' },
  { src: '/prints/feedback-1.png', w: 1320, h: 2585, alt: 'Depoimento real sobre metas e participação da equipe no BarberMeta' },
  { src: '/prints/feedback-2.png', w: 1320, h: 2572, alt: 'Depoimento real de cliente estudando o BarberMeta' },
  { src: '/prints/feedback-3.png', w: 1320, h: 2585, alt: 'Depoimento real de cliente com a meta ouro atingida' },
  { src: '/prints/feedback-4.png', w: 1320, h: 2570, alt: 'Depoimento real sobre o engajamento da equipe' },
  { src: '/prints/feedback-5.png', w: 1302, h: 1614, alt: 'Depoimento real sobre a facilidade de uso do BarberMeta' },
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
              <Image src={depoimento.src} width={depoimento.w} height={depoimento.h} alt={depoimento.alt} sizes="235px" className="block h-auto w-full" />
            </figure>
          ))}
        </div>
        <CarouselNudge className="carousel-nudge-y-center right-3 top-1/2 sm:right-5" />
      </div>
      <p className="mt-3 px-4 text-center text-xs text-[#748093]">Mensagens publicadas com autorização dos clientes.</p>
    </section>
  )
}
