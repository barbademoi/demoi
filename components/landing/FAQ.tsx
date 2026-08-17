const perguntas = [
  {
    q: 'O que está incluído na assinatura?',
    a: 'Tudo que aparece nesta página. Metas, ranking, campanhas, Brindoleta, financeiro, Feedback Premiado, cards, 8 aulas, comunidade e suporte.',
  },
  {
    q: 'Como funciona a garantia de 30 dias?',
    a: 'Você tem 30 dias para usar com sua equipe. Se não gostar, cancela dentro do prazo e devolvemos 100%.',
  },
  {
    q: 'Qual é a diferença entre o plano mensal e o anual?',
    a: 'As ferramentas são as mesmas. O anual sai por R$ 24,75/mês e economiza R$ 121,80 no ano.',
  },
  {
    q: 'Já sou cliente vitalício. O que muda para mim?',
    a: 'Nada muda: você continua com tudo o que já tem. Ferramenta extra fora do seu acesso segue disponível à parte.',
  },
  {
    q: 'Preciso trocar meu sistema de agendamento?',
    a: 'Não. O BarberMeta trabalha junto com a agenda que você já usa.',
  },
  {
    q: 'Como cada profissional acessa?',
    a: 'Por um link próprio, sem conta e sem senha. Na Brindoleta, cada um ganha o seu QR Code.',
  },
  {
    q: 'E se eu não souber configurar?',
    a: 'São 8 aulas práticas, comunidade no WhatsApp e suporte direto. A configuração é simples.',
  },
]

export default function FAQ() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-9 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Antes de assinar</p>
          <h2 className="text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">Dúvidas frequentes</h2>
        </div>

        <div className="rounded-2xl border border-[#DDE1E6] bg-[#F8F9FA] px-5 shadow-sm sm:px-7">
          {perguntas.map((pergunta) => (
            <details key={pergunta.q} className="group border-b border-[#E1E5EA] last:border-0">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-[#101828] transition-colors hover:text-[#9A650F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B77916] [&::-webkit-details-marker]:hidden">
                <span>{pergunta.q}</span>
                <span aria-hidden="true" className="shrink-0 text-xl text-[#B77916] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 pr-8 text-base leading-relaxed text-[#59677A]">{pergunta.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
