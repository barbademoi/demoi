const depoimentos = [
  { src: '/prints/feedback-1.png', alt: 'Depoimento no Instagram sobre o uso da gamificação' },
  { src: '/prints/feedback-2.png', alt: 'Depoimento de cliente estudando o BarberMeta' },
  { src: '/prints/feedback-3.png', alt: 'Depoimento de cliente com a meta ouro atingida' },
  { src: '/prints/feedback-4.png', alt: 'Depoimento de cliente sobre o engajamento da equipe' },
  { src: '/prints/feedback-5.png', alt: 'Depoimento de cliente sobre a facilidade de uso' },
]

export default function Depoimentos() {
  return (
    <section className="overflow-hidden bg-[#0F1F2D] py-16 sm:py-20">
      <div className="mx-auto mb-10 max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Provas reais</p>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">O que estão falando do BarberMeta.</h2>
        <p className="mt-4 text-base text-[#A0AEC0]">Mensagens reais de mais de 600 barbearias usando o sistema.</p>

        <figure className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#D4A85A]/35 bg-[#D4A85A]/[0.08] px-6 py-6 sm:px-8 sm:py-7">
          <blockquote className="text-xl font-bold leading-snug text-white sm:text-2xl">
            &ldquo;Primeiro ciclo usando o app: batemos a meta ouro. R$ 60.016 no mês.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-sm font-semibold text-[#D4A85A]">— Geison, dono de barbearia</figcaption>
        </figure>
      </div>

      <div className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:gap-6 sm:px-6">
        {depoimentos.map((depoimento) => (
          <figure key={depoimento.src} className="w-[72vw] max-w-[250px] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-[#0F1117] shadow-xl shadow-black/30 sm:w-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={depoimento.src} alt={depoimento.alt} className="block h-auto w-full" loading="lazy" />
          </figure>
        ))}
      </div>
      <p className="mt-4 px-4 text-center text-xs text-[#A0AEC0]">Prints publicados com autorização dos clientes.</p>
    </section>
  )
}
