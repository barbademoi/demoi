import CTAButton from './CTAButton'

const pilares = [
  {
    destaque: '30 dias',
    titulo: 'Garantia sem enrolação',
    texto: 'Você assina hoje e usa o BarberMeta na rotina. Se não gostar, peça o cancelamento dentro do prazo e receba 100% do valor pago.',
  },
  {
    destaque: '8 aulas',
    titulo: 'Direto ao ponto',
    texto: 'Aulas práticas explicam como configurar a ferramenta e aplicar as estratégias com a equipe, sem conteúdo desnecessário.',
  },
  {
    destaque: 'Suporte',
    titulo: 'Rápido e humanizado',
    texto: 'Você encontra ajuda dentro do próprio sistema para não ficar travado durante a implementação.',
  },
]

export default function Garantia() {
  return (
    <section id="garantia" className="overflow-hidden bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            <span aria-hidden="true">✓</span> Garantia de reembolso por 30 dias
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            Assine hoje e use por 30 dias. Se não gostar, devolvemos{' '}
            <span className="text-[#F4B942]">100% do investimento.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            O pagamento é feito no momento da assinatura. Depois, você configura, aplica com a equipe e tem 30 dias para decidir com tranquilidade.
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
          <CTAButton label="Assinar com garantia de 30 dias" id="cta-garantia-planos" gtmClass="gtm-cta-garantia" />
          <p className="text-xs font-semibold text-emerald-300">Compra segura pela Hotmart · garantia de 30 dias · reembolso de 100%</p>
        </div>
      </div>
    </section>
  )
}
