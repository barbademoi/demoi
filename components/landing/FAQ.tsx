const perguntas = [
  {
    q: 'O que está incluído na assinatura?',
    a: 'Novos assinantes recebem todas as ferramentas mostradas nesta página: metas, ranking, campanhas, Brindoleta, organização do dinheiro, Feedback Premiado, cards, aulas, comunidade no WhatsApp e suporte humanizado.',
  },
  {
    q: 'Qual é a diferença entre o plano mensal e o anual?',
    a: 'As ferramentas são as mesmas. O mensal custa R$ 34,90 por mês. O anual custa R$ 297 à vista, equivale a R$ 24,75 por mês e economiza R$ 121,80 em comparação com doze mensalidades. A Hotmart também oferece parcelamento do anual com acréscimo.',
  },
  {
    q: 'Já sou cliente vitalício. O que muda para mim?',
    a: 'Nada muda. Você continua com tudo o que já possui. Se quiser uma ferramenta extra que não faz parte do seu acesso, poderá comprá-la separadamente.',
  },
  {
    q: 'Preciso trocar meu sistema de agendamento?',
    a: 'Não. Continue usando sua agenda normalmente. O BarberMeta trabalha junto com ela e cuida de outra parte: metas, participação da equipe e novas oportunidades de venda.',
  },
  {
    q: 'Como cada profissional acessa?',
    a: 'Cada profissional recebe um link próprio, sem conta e sem senha, para acompanhar metas e resultados no celular. Na Brindoleta, cada profissional também recebe seu QR Code.',
  },
  {
    q: 'E se eu não souber configurar?',
    a: 'A configuração foi pensada para ser simples. Você também recebe aulas práticas, participa da comunidade ativa no WhatsApp e pode contar com suporte humanizado.',
  },
  {
    q: 'Como funcionam os planos e a renovação?',
    a: 'Mensal e anual liberam as mesmas ferramentas para novos assinantes. A cobrança e a renovação são feitas com segurança pela Hotmart.',
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
