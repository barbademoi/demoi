sed: --: No such file or directory
const dores = [
  {
    numero: '01',
    titulo: 'A meta some no WhatsApp',
    texto: 'Você manda no grupo, mas poucos acompanham o que falta durante o mês.',
  },
  {
    numero: '02',
    titulo: 'A cobrança sobra para você',
    texto: 'Sem progresso visível, é o dono que precisa lembrar, pressionar e correr atrás.',
  },
  {
    numero: '03',
    titulo: 'A reação chega tarde',
    texto: 'Quando alguém percebe que ficou para trás, já faltam poucos dias para recuperar.',
  },
]

export default function Dor() {
  return (
    <section className="bg-[#F6F4EF] px-4 py-16 text-[#101828] sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Por que eu criei o BarberMeta</p>
            <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl">
              A meta não vende quando só o dono consegue enxergar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#526070] sm:text-lg">
              O problema não é falta de meta. É falta de acompanhamento simples, diário e visível para quem precisa bater essa meta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {dores.map((dor) => (
              <article key={dor.numero} className="rounded-2xl border border-[#DDE1E6] bg-white p-5 shadow-sm">
                <span className="text-xs font-bold tracking-wider text-[#B77916]">{dor.numero}</span>
                <h3 className="mt-4 text-lg font-bold leading-snug text-[#101828]">{dor.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#667384]">{dor.texto}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-[#101828] px-5 py-5 text-center text-base font-semibold text-white sm:px-8 sm:text-lg">
          O BarberMeta coloca a meta na mão do barbeiro — e tira a cobrança das costas do dono.
        </div>
      </div>
    </section>
  )
}
