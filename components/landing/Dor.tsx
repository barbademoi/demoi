const dores = [
  { emoji: '😤', titulo: 'Cobrança chata todo fim de mês', texto: 'Você precisa cobrar quem não bateu meta. A conversa pesa e a relação esfria.' },
  { emoji: '💬', titulo: 'Texto no WhatsApp não motiva', texto: 'A meta vai no grupo, ninguém abre e, no dia 15, ninguém lembra mais.' },
  { emoji: '👀', titulo: 'Você descobre tarde demais', texto: 'Só no fim do mês percebe quem está longe da meta. Aí já não dá tempo de correr.' },
]

export default function Dor() {
  return (
    <section className="bg-[#0F1F2D] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">O problema</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">A meta existe. O acompanhamento não.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#A0AEC0] sm:text-lg">Sem enxergar o próprio progresso, a equipe trabalha no piloto automático e a cobrança volta para você.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {dores.map((dor) => (
            <article key={dor.titulo} className="rounded-2xl border border-white/10 bg-[#0A1929] p-6">
              <span aria-hidden="true" className="text-3xl">{dor.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-white">{dor.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A0AEC0]">{dor.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
