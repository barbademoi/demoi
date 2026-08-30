import CTAButton from './CTAButton'

const pilares = [
  {
    emoji: '📱',
    titulo: 'Metas na mão da equipe',
    texto: 'Cada profissional acompanha meta, comissão, ritmo e ranking pelo próprio celular.',
  },
  {
    emoji: '🎡',
    titulo: 'Brindoleta para vender mais',
    texto: 'Uma roleta de ofertas com QR Code individual e resultado por colaborador.',
  },
  {
    emoji: '💰',
    titulo: 'Financeiro no mesmo lugar',
    texto: 'Organize caixa, contas, folha da equipe e acompanhe quanto realmente sobra.',
  },
  {
    emoji: '🤝',
    titulo: 'Ajuda de verdade',
    texto: 'Comunidade ativa no WhatsApp, aulas práticas e suporte humanizado.',
  },
]

const recursos = [
  'Metas individuais e coletiva com ranking ao vivo',
  'Lançamento diário simples pelo celular',
  'Brindoleta com QR Code por colaborador',
  'Controle financeiro e folha da equipe',
  'Feedback Premiado e direcionamento para avaliações',
  'Cards prontos para compartilhar no WhatsApp',
  'Mensagens e resumos de reunião com IA',
  'Aulas práticas, comunidade e atualizações',
]

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Tudo dentro do acesso anual</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">Um sistema completo para organizar, engajar e vender mais.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">Todos os módulos entram juntos, sem plano pra escolher e sem cobrança extra por módulo.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((item) => (
            <article key={item.titulo} className="rounded-2xl border border-white/10 bg-[#0E1A2B] p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-[#F4B942]/30">
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
          <CTAButton label="Quero 1 ano por R$ 97" id="cta-funcionalidades-planos" gtmClass="gtm-cta-funcionalidades" />
          <p className="text-xs text-[#8FA0B3]">Pagamento único de R$ 97 · 1 ano com todos os módulos</p>
        </div>
      </div>
    </section>
  )
}
