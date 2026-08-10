import CTAButton from './CTAButton'

const pilares = [
  {
    destaque: '30 dias',
    titulo: 'Garantia sem enrolação',
    texto: 'Use o BarberMeta na rotina. Se não gostar, peça o cancelamento dentro do prazo e receba 100% do investimento de volta.',
  },
  {
    destaque: '8 aulas',
    titulo: 'Direto ao ponto',
    texto: 'Aulas práticas explicam como configurar a ferramenta e aplicar as estratégias com a equipe, sem conteúdo desnecessário.',
  },
  {
    destaque: '< 1 corte',
    titulo: 'Investimento acessível',
    texto: 'A mensalidade custa menos que um corte de cabelo e coloca metas, campanhas e ferramentas de venda na mão da equipe.',
  },
]

export default function Garantia() {
  return (
    <section id="garantia" className="overflow-hidden bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            <span aria-hidden="true">✓</span> Risco zero para começar
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            Use por 30 dias. Se não gostar, devolvemos{' '}
            <span className="text-[#F4B942]">100% do investimento.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            Sem enrolação e sem tentar prender você. Entre, configure, aplique com a equipe e veja o BarberMeta funcionando na sua rotina.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pilares.map((pilar) => (
            <article key={pilar.titulo} className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-black/10">
              <strong className="font-serif text-4xl leading-none text-[#F4B942]">{pilar.destaque}</strong>
              <h3 className="mt-4 text-lg font-bold text-white">{pilar.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#AEBBCB]">{pilar.texto}</p>
            </article>
          ))}
        </div>

        <div className="mt-9 flex flex-col items-center gap-3 text-center">
          <CTAButton label="Quero testar o BarberMeta por 30 dias" id="cta-garantia-planos" gtmClass="gtm-cta-garantia" />
          <p className="text-xs font-semibold text-emerald-300">Compra segura pela Hotmart · garantia de 30 dias · reembolso de 100%</p>
        </div>
      </div>
    </section>
  )
}
