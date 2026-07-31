import Image from 'next/image'
import PhoneMockup from './PhoneMockup'

const demonstracao = [
  {
    passo: '1. Configure',
    img: '/prints/img_6056.png',
    width: 900,
    height: 1679,
    alt: 'Controle manual de números da equipe antes do BarberMeta',
    titulo: 'Defina as metas da barbearia',
    texto: 'Configure uma vez o que cada pessoa precisa buscar no mês.',
  },
  {
    passo: '2. Compartilhe',
    img: '/prints/img_6057.png',
    width: 900,
    height: 1367,
    alt: 'Tela simples para o barbeiro lançar o próprio dia no BarberMeta',
    titulo: 'Envie o link individual',
    texto: 'Sem app e sem senha. O barbeiro lança o próprio dia pelo celular.',
  },
  {
    passo: '3. Acompanhe',
    img: '/prints/img_6058.png',
    width: 900,
    height: 1488,
    alt: 'Dashboard do BarberMeta com ritmo, pontuação e metas',
    titulo: 'Deixe o progresso fazer a cobrança',
    texto: 'Meta, ritmo e ranking ficam visíveis. Quem está atrás sabe que precisa acelerar.',
  },
]

export default function AntesDepois() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Veja o sistema por dentro</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">Em poucos minutos, a equipe inteira sabe onde está.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">Você continua usando seu sistema de gestão. O BarberMeta entra para transformar os números em ação.</p>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {demonstracao.map((item) => (
            <article key={item.passo} className="w-[84vw] max-w-[320px] shrink-0 snap-center rounded-3xl border border-white/10 bg-[#0E1A2B] p-5 sm:w-auto sm:max-w-none">
              <span className="mb-5 inline-flex rounded-full border border-[#F4B942]/30 bg-[#F4B942]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFD16A]">{item.passo}</span>
              <PhoneMockup maxWidth={220}>
                <Image src={item.img} width={item.width} height={item.height} alt={item.alt} sizes="(max-width: 640px) 58vw, 220px" className="block h-auto w-full" />
              </PhoneMockup>
              <h3 className="mt-5 text-center text-lg font-bold text-white">{item.titulo}</h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-[#9DACBD]">{item.texto}</p>
            </article>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[#8FA0B3] sm:hidden">Deslize para ver as 3 etapas →</p>
      </div>
    </section>
  )
}
