import PhoneMockup from './PhoneMockup'

const demonstracao = [
  { badge: 'Antes', badgeClass: 'border-red-800/40 bg-red-950/40 text-red-400', img: '/prints/img_6056.png', width: 900, height: 1679, alt: 'Grupo do WhatsApp com mensagens manuais de controle diário dos barbeiros', legenda: 'Cada barbeiro digitava à mão. A informação se perdia e ninguém via o próprio progresso.' },
  { badge: 'Lançamento', badgeClass: 'border-emerald-800/40 bg-emerald-950/40 text-emerald-400', img: '/prints/img_6057.png', width: 900, height: 1367, alt: 'Tela do BarberMeta para lançar serviços do dia', legenda: 'Toca + ou − nos serviços e o total calcula sozinho. Tudo pelo celular.' },
  { badge: 'Acompanhamento', badgeClass: 'border-[#D4A85A]/40 bg-[#D4A85A]/15 text-[#D4A85A]', img: '/prints/img_6058.png', width: 900, height: 1488, alt: 'Dashboard do barbeiro mostrando ritmo, pontuação e metas', legenda: 'Cada barbeiro vê o ritmo, quanto falta para a meta e sua posição no ranking.' },
]

export default function AntesDepois() {
  return (
    <section className="bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Demonstração</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Do controle perdido ao progresso visível.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#A0AEC0] sm:text-lg">Antes do BarberMeta, o controle diário ficava num grupo do WhatsApp. Agora, lançamento e acompanhamento ficam no mesmo fluxo.</p>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {demonstracao.map((item) => (
            <article key={item.img} className="w-[84vw] max-w-[320px] shrink-0 snap-center rounded-2xl border border-white/10 bg-[#0F1F2D] p-5 sm:w-auto sm:max-w-none">
              <span className={`mb-5 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${item.badgeClass}`}>{item.badge}</span>
              <PhoneMockup maxWidth={230}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} width={item.width} height={item.height} alt={item.alt} className="block h-auto w-full" loading="lazy" />
              </PhoneMockup>
              <p className="mt-5 text-center text-sm leading-relaxed text-[#A0AEC0]">{item.legenda}</p>
            </article>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[#A0AEC0] sm:hidden">Deslize para ver as telas →</p>
      </div>
    </section>
  )
}
