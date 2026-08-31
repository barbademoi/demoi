import Image from 'next/image'
import CarouselNudge from './CarouselNudge'

/**
 * RELATOS DA COMUNIDADE, transcritos dos prints do WhatsApp.
 *
 * Vão como TEXTO e não como imagem por três motivos que importam:
 *
 * 1. PRIVACIDADE. Os prints originais mostram o número de telefone completo de
 *    cada pessoa. Publicar a imagem seria jogar o celular de um cliente na
 *    internet aberta. Aqui fica só o primeiro nome.
 * 2. Print de conversa não é lido por leitor de tela e não indexa no Google.
 * 3. O número que convence — 250 vira 998 — fica ilegível numa imagem
 *    reduzida a 235px no carrossel.
 *
 * A transcrição é fiel; o que foi feito é cortar repetição e juntar mensagens
 * seguidas da mesma pessoa numa fala só. Nenhum número foi arredondado.
 *
 * As cores são versões ESCURAS dos acentos da marca: esta seção tem fundo
 * branco, e o lima e o latão que brilham no carvão desaparecem nele. O matiz
 * é o mesmo, o contraste é que muda.
 */
const RELATOS = [
  {
    numero: 'R$ 250 → R$ 998',
    rotulo: 'em serviço extra, no mesmo barbeiro',
    texto: 'Essa ferramenta é absurda, tem mudado o jogo de serviço extra e produto na minha barbearia. Eu tinha profissional que fazia 150 de extra, outro que no máximo estourava 250, e um que vivia reclamando que não conseguia vender. No último mês o de 250 fez 998, o de 150 fez quase 500, e o que não conseguia vender fez quase 400 só de extra. E esses eram os mais fracos em vendas do time.',
    autor: 'Well',
    contexto: 'barbearia com 9 barbeiros',
    cor: 'border-[#4D7C0F]/25 bg-[#F3F8E8]',
    corNumero: 'text-[#3F6212]',
  },
  {
    numero: 'R$ 60.287',
    rotulo: 'no mês, com a meta batida na reta final',
    texto: 'Na quinta-feira à noite faltava mais de 8.700 pra batermos a meta de 60 mil. Aí fiz uma reunião e conseguimos deixar pra hoje só 230 reais. Sexta e sábado fizemos mais de 4 mil por dia. Graças ao BarberMeta, motivou o time a vender mais.',
    autor: 'Reinaldo',
    contexto: 'dono de barbearia',
    cor: 'border-[#B77916]/25 bg-[#FFF9EC]',
    corNumero: 'text-[#9A650F]',
  },
  {
    numero: '2 dias',
    rotulo: 'de uso — e já com sugestão aplicada',
    texto: 'Entrei faz uns 2 dias e tô pirando nas funcionalidades. E o mais dahora é poder conversar com você, dono do sistema, ter esse acompanhamento e você escutar nossas sugestões pra ficar ainda melhor.',
    autor: 'Barbearia Almeida',
    contexto: 'cliente novo',
    cor: 'border-[#0369A1]/25 bg-[#EFF8FE]',
    corNumero: 'text-[#0369A1]',
  },
]

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

      {/* Os relatos em texto vêm ANTES do carrossel de prints: o número que
          convence precisa ser lido, e print de conversa a 235px não é. */}
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {RELATOS.map((r) => (
            <figure key={r.autor} className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${r.cor}`}>
              <p className={`font-serif text-2xl leading-none sm:text-[1.75rem] ${r.corNumero}`}>{r.numero}</p>
              <p className="mt-1.5 text-xs font-semibold leading-snug text-[#59677A]">{r.rotulo}</p>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[#243247]">
                &ldquo;{r.texto}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t border-black/10 pt-3 text-sm">
                <span className="font-bold text-[#101828]">{r.autor}</span>
                <span className="text-[#748093]"> · {r.contexto}</span>
              </figcaption>
            </figure>
          ))}
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
