import LandingIcon, { type LandingIconName } from './LandingIcon'

const itens: Array<{
  titulo: string
  detalhe: string
  icon: LandingIconName
  cor: string
  fundo: string
}> = [
  {
    titulo: 'MiniApp completo',
    detalhe: 'Todas as ferramentas mostradas nesta página.',
    icon: 'spark',
    cor: 'text-[#74A4FF]',
    fundo: 'bg-[#1E63E9]/15',
  },
  {
    titulo: 'Suporte rápido e humanizado',
    detalhe: 'Ajuda dentro do próprio MiniApp.',
    icon: 'phone',
    cor: 'text-[#64E3BA]',
    fundo: 'bg-[#64E3BA]/10',
  },
  {
    titulo: 'Comunidade ativa',
    detalhe: 'Mais de 600 barbearias trocando experiências.',
    icon: 'team',
    cor: 'text-[#25D366]',
    fundo: 'bg-[#25D366]/10',
  },
  {
    titulo: 'Aulas de implementação',
    detalhe: 'Do zero à aplicação com sua equipe.',
    icon: 'target',
    cor: 'text-[#FFD16A]',
    fundo: 'bg-[#F4B942]/10',
  },
  {
    titulo: 'Garantia de 30 dias',
    detalhe: 'Não gostou? Receba 100% do valor de volta.',
    icon: 'shield',
    cor: 'text-[#FF8BBE]',
    fundo: 'bg-[#FF4FA3]/10',
  },
]

export default function TudoIncluso() {
  return (
    <section id="incluso" className="relative overflow-hidden bg-[#07111F] px-4 py-14 sm:px-6 sm:py-16">
      <div aria-hidden="true" className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#1E63E9]/15 blur-[100px]" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[#F4B942]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-[#F4B942]/30 bg-[#F4B942]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#FFD16A]">
            Tudo incluso no acesso anual
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
            Você recebe o MiniApp inteiro e o apoio para colocar em prática.
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {itens.map((item, indice) => (
            <article key={item.titulo} className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/20">
              <span className="absolute right-4 top-3 text-[10px] font-black tabular-nums text-white/20">0{indice + 1}</span>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.fundo} ${item.cor}`}>
                <LandingIcon name={item.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold leading-tight text-white">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#AEBBCB]">{item.detalhe}</p>
              <span className="mt-5 block h-1 w-10 rounded-full transition-all group-hover:w-16" style={{ backgroundColor: indice === 0 ? '#74A4FF' : indice === 1 ? '#64E3BA' : indice === 2 ? '#25D366' : indice === 3 ? '#FFD16A' : '#FF8BBE' }} aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
