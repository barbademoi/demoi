import DepoimentosCarousel from './DepoimentosCarousel'

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
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Resultado real</p>
        <h2 className="text-balance text-[2rem] font-black leading-[1.08] tracking-[-0.03em] text-[#101828] sm:text-5xl">
          Veja o que dizem sobre o <span className="text-[#9A650F]">BarberMeta</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#59677A]">
          O BarberMeta já faz parte da rotina de mais de 600 barbearias.
        </p>
      </div>

      <DepoimentosCarousel depoimentos={depoimentos} />

      <p className="mt-3 px-4 text-center text-xs text-[#748093]">Mensagens publicadas com autorização dos clientes.</p>
    </section>
  )
}
