const perguntas = [
  {
    q: 'O que está incluído nos R$ 97?',
    a: 'Tudo que aparece nesta página. Metas, ranking, campanhas, Brindoleta, financeiro, Feedback Premiado, cards, 8 aulas, comunidade e suporte.',
  },
  {
    q: 'Como funciona a garantia de 30 dias?',
    a: 'Você tem 30 dias para usar com sua equipe. Se não gostar, cancela dentro do prazo e devolvemos 100%.',
  },
  {
    q: 'É mensalidade? Vai cobrar de novo no meu cartão?',
    a: 'Não. É pagamento único de R$ 97 e dá 1 ano de acesso completo. Não há renovação automática: quando o ano acabar, você decide se compra outro.',
  },
  {
    q: 'Já sou cliente vitalício. O que muda para mim?',
    a: 'Nada muda: seu acesso é permanente e continua sendo. Esta oferta de 1 ano vale para quem está comprando agora e não altera nada do que você já tem.',
  },
  {
    q: 'E quando o ano acabar?',
    a: 'Você recebe um aviso 3 dias antes. Se não renovar, o acesso é bloqueado — mas nada é apagado: barbeiros, metas, lançamentos e histórico continuam no lugar, esperando você voltar.',
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
