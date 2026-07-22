import CTAButton from './CTAButton'

const destaques = [
  { emoji: '🏆', titulo: 'Ranking ao vivo', texto: 'Cada barbeiro vê onde está. Quem está atrás, corre sem você precisar falar.' },
  { emoji: '📱', titulo: 'Link individual', texto: 'Acessa pelo celular, sem senha, e acompanha comissão, ritmo e metas.' },
  { emoji: '🎯', titulo: 'Meta coletiva', texto: 'Defina uma meta geral com premiação para todo mundo puxar junto.' },
]

const recursos = [
  'Ranking ao vivo entre os barbeiros',
  'Link individual por barbeiro — sem app, sem senha',
  'Metas Bronze, Prata e Ouro + meta coletiva',
  'Campanha de pontos (gamificação) com premiação',
  'Lançamento diário em 1 tela, em 2 minutos',
  'Cards prontos pra mandar no grupo do WhatsApp',
  'Mensagem motivadora diária gerada por IA',
  '8 aulas práticas ensinando como fazer o time vender mais',
]

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Funcionalidades</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">O BarberMeta no centro da operação.</h2>
          <p className="mt-4 text-base text-[#A0AEC0] sm:text-lg">Tudo que sua equipe precisa pra vender mais — num só lugar.</p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {destaques.map((item) => (
            <article key={item.titulo} className="rounded-2xl border border-[#D4A85A]/25 bg-[#D4A85A]/[0.06] p-5">
              <span aria-hidden="true" className="text-3xl">{item.emoji}</span>
              <h3 className="mt-4 font-bold text-white">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A0AEC0]">{item.texto}</p>
            </article>
          ))}
        </div>

        <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          {recursos.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0F1F2D] px-4 py-3 text-sm leading-relaxed text-[#E2E8F0]">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#D4A85A]">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <CTAButton id="cta-funcionalidades-oferta" gtmClass="gtm-cta-funcionalidades" />
        </div>
      </div>
    </section>
  )
}
