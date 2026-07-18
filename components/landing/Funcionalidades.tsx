sed: --: No such file or directory
import CTAButton from './CTAButton'

const destaques = [
  { emoji: '🏆', titulo: 'Ranking ao vivo', texto: 'Cada barbeiro vê onde está. Quem está atrás, corre sem você precisar falar.' },
  { emoji: '📱', titulo: 'Link individual', texto: 'Acessa pelo celular, sem senha, e acompanha comissão, ritmo e metas.' },
  { emoji: '🎯', titulo: 'Meta coletiva', texto: 'Defina uma meta geral com premiação para todo mundo puxar junto.' },
]

const grupos = [
  {
    grupo: 'Metas e comissão',
    itens: [
      'Metas individuais por barbeiro com 3 tiers (Bronze · Prata · Ouro)',
      'Meta coletiva da barbearia com prêmios próprios',
      'Cálculo automático de comissão acumulada do ciclo',
      'Ranking ao vivo entre barbeiros',
      'Comparativo de meses (4 meses lado a lado)',
      'Histórico de meses navegável',
    ],
  },
  {
    grupo: 'Link individual do barbeiro',
    itens: [
      'Cada barbeiro tem seu próprio link público — sem senha, sem app',
      'Vê comissão acumulada, ritmo e posição no ranking',
      'Mensagem motivadora diária gerada por IA',
      'Visibilidade do ranking configurável (completo · só posição · só o próprio)',
      'Opção para mostrar ou esconder faturamento geral e ticket médio',
    ],
  },
  {
    grupo: 'Campanha de pontos (gamificação)',
    itens: [
      'Configure quais serviços pontuam e quanto cada um vale',
      'Slot fixo de assinatura com bônus por quantidade vendida',
      'Pontos mínimos separados para barbeiro e recepcionista',
      'Premiação por posição no ranking de pontos',
      'Regras gerais editáveis pelo dono',
    ],
  },
  {
    grupo: 'Comunicação e operação',
    itens: [
      'Lançamento diário em 1 tela (2 minutos)',
      'Cards prontos para mandar no WhatsApp do grupo',
      'Resumo de reunião gerado por IA para o início do mês',
      'Modo Equipe ou Modo Sozinho (autônomo)',
    ],
  },
  {
    grupo: 'Aprendizado incluso',
    itens: [
      '6 aulas curtas com Carlos Henrique, dono que usa o sistema',
      '2 tipos de metas e gamificação explicados na prática',
      'Tutoriais em vídeo dentro do dashboard',
    ],
  },
  {
    grupo: 'Feedback de Cliente + brindes',
    plus: true,
    itens: [
      'Link público para cliente avaliar, com QR Code e botão de WhatsApp',
      'Brindes sorteados por peso e validade configurável',
      'Brinde mínimo garantido',
      'Direcionamento de 4+ estrelas para Google Reviews',
      'Brinde aparece no link do barbeiro para o próximo atendimento',
      'Painel filtrado por período, estrela, barbeiro e brinde',
      'Gamificação opcional: feedback positivo dá pontos ao barbeiro',
    ],
  },
  {
    grupo: 'Controle Financeiro',
    plus: true,
    itens: [
      'Caixa (banco, dinheiro e Pix)',
      'Contas a pagar: única, fixa mensal e parcelada',
      'Contas a receber',
      'Folha da equipe com sincronização automática do BarberMeta',
      'Demonstrativo de quanto sobra no mês',
      'Empresa e pessoal separados',
      'Tudo na nuvem, sincronizado entre aparelhos',
    ],
  },
]

export default function Funcionalidades() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Funcionalidades</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">O BarberMeta no centro da operação.</h2>
          <p className="mt-4 text-base text-[#A0AEC0] sm:text-lg">Comece pelo essencial. Abra os grupos abaixo para conferir a lista completa.</p>
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

        <div className="grid gap-3 md:grid-cols-2">
          {grupos.map((grupo) => (
            <details key={grupo.grupo} className={`group rounded-2xl border p-5 ${grupo.plus ? 'border-[#D4A85A]/40 bg-[#1A1410]' : 'border-white/10 bg-[#0F1F2D]'}`}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A85A] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  {grupo.grupo}
                  {grupo.plus && <span className="rounded-full bg-[#D4A85A] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F1117]">Plus</span>}
                </span>
                <span aria-hidden="true" className="text-xl text-[#D4A85A] transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
                {grupo.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#A0AEC0]">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#D4A85A]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <CTAButton id="cta-funcionalidades-oferta" gtmClass="gtm-cta-funcionalidades" />
        </div>
      </div>
    </section>
  )
}
