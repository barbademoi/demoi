sed: --: No such file or directory
import CTAButton from './CTAButton'

const pilares = [
  {
    emoji: '📱',
    titulo: 'Meta no bolso de cada barbeiro',
    texto: 'Link individual, sem app e sem senha, com comissão, ritmo e quanto falta para a meta.',
  },
  {
    emoji: '🏆',
    titulo: 'Competição saudável no time',
    texto: 'Ranking ao vivo, campanha de pontos e metas Bronze, Prata, Ouro e coletiva.',
  },
  {
    emoji: '📊',
    titulo: 'Visão clara para o dono',
    texto: 'Acompanhe a evolução da equipe e descubra cedo quem precisa de direção.',
  },
  {
    emoji: '🎥',
    titulo: '8 aulas práticas incluídas',
    texto: 'Veja como uso o BarberMeta na minha própria barbearia para fazer o time vender mais.',
  },
]

const recursos = [
  'Lançamento diário simples pelo celular',
  'Cards prontos para mandar no WhatsApp',
  'Mensagem motivadora diária gerada por IA',
  'Premiação por metas e campanha de pontos',
  'Módulo de reunião com a equipe',
  'Acompanhamento de comportamento',
]

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">O que você leva</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">Um sistema simples para transformar meta em rotina.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">Sem planilha espalhada. Sem depender de mensagem no grupo. Tudo gira em torno do que a equipe precisa fazer hoje.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((item) => (
            <article key={item.titulo} className="rounded-2xl border border-white/10 bg-[#0E1A2B] p-5">
              <span aria-hidden="true" className="text-3xl">{item.emoji}</span>
              <h3 className="mt-4 text-lg font-bold leading-snug text-white">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9DACBD]">{item.texto}</p>
            </article>
          ))}
        </div>

        <ul className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
          {recursos.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-[#D6DEE8]">
              <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-emerald-400">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-col items-center gap-2">
          <CTAButton label="Quero o BarberMeta — R$ 47" id="cta-funcionalidades-oferta" gtmClass="gtm-cta-funcionalidades" />
          <p className="text-xs text-[#8FA0B3]">Pagamento único · acesso vitalício</p>
        </div>
      </div>
    </section>
  )
}
