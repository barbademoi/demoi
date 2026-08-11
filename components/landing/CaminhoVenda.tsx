import LandingIcon, { type LandingIconName } from './LandingIcon'

const etapas: Array<{
  numero: string
  titulo: string
  texto: string
  icon: LandingIconName
  cor: string
  fundo: string
  borda: string
}> = [
  {
    numero: '01',
    titulo: 'Veja a meta',
    texto: 'O número deixa de ficar só na cabeça do dono.',
    icon: 'target',
    cor: 'text-[#1E63E9]',
    fundo: 'bg-[#EAF1FF]',
    borda: 'border-[#BCD0FF]',
  },
  {
    numero: '02',
    titulo: 'Envolva a equipe',
    texto: 'Cada profissional entende o foco do dia.',
    icon: 'team',
    cor: 'text-[#7C3AED]',
    fundo: 'bg-[#F2EAFF]',
    borda: 'border-[#D9C4FF]',
  },
  {
    numero: '03',
    titulo: 'Crie oportunidades',
    texto: 'Campanhas e Brindoleta ajudam a oferecer mais.',
    icon: 'gift',
    cor: 'text-[#D94B24]',
    fundo: 'bg-[#FFF0EA]',
    borda: 'border-[#FFC8B6]',
  },
  {
    numero: '04',
    titulo: 'Acompanhe o resultado',
    texto: 'Você enxerga o que avançou e ajusta o próximo passo.',
    icon: 'chart',
    cor: 'text-[#087A55]',
    fundo: 'bg-[#E8FAF3]',
    borda: 'border-[#ACE8D3]',
  },
]

export default function CaminhoVenda() {
  return (
    <section className="relative overflow-hidden bg-[#F6F4EF] px-4 py-10 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#1E63E9]/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-[#F4B942]/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B77916]">Um ciclo simples, todos os dias</p>
            <h2 className="mt-2 max-w-2xl text-balance text-2xl font-bold tracking-[-0.025em] text-[#101828] sm:text-3xl">
              Da meta à venda, cada tela puxa a próxima ação.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#59677A] sm:text-right">
            O BarberMeta transforma números parados em um caminho visual que a equipe entende e consegue seguir.
          </p>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-9 hidden border-t-2 border-dashed border-[#CCD2DB] lg:block" />
          {etapas.map((etapa) => (
            <article key={etapa.numero} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_12px_30px_rgba(16,24,40,0.07)] ${etapa.borda}`}>
              <span aria-hidden="true" className={`absolute -right-2 -top-5 font-serif text-[5rem] font-black leading-none opacity-[0.07] ${etapa.cor}`}>
                {etapa.numero}
              </span>
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${etapa.fundo} ${etapa.cor}`}>
                <LandingIcon name={etapa.icon} className="h-6 w-6" />
              </div>
              <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.18em] ${etapa.cor}`}>Passo {etapa.numero}</p>
              <h3 className="mt-1.5 text-lg font-bold text-[#101828]">{etapa.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#59677A]">{etapa.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
