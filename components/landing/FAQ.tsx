sed: --: No such file or directory
const perguntas = [
  {
    q: 'Preciso trocar meu sistema de gestão?',
    a: 'Não. Você continua usando o sistema que já usa. O BarberMeta entra para mostrar metas, ritmo e ranking para a equipe de forma simples.',
  },
  {
    q: 'Como cada barbeiro acessa? Eles vão saber mexer?',
    a: 'Cada barbeiro recebe um link único, sem conta e sem senha. Quem usa WhatsApp consegue usar: é só abrir no celular e acompanhar os próprios números.',
  },
  {
    q: 'Posso adicionar barbeiros ou recepcionistas depois?',
    a: 'Sim. Você pode cadastrar barbeiros e recepcionistas, cada um com sua meta e seu link próprio, sem custo por usuário.',
  },
  {
    q: 'Funciona para quem trabalha sozinho?',
    a: 'Sim. No modo autônomo, você acompanha metas, histórico mês a mês e progresso sem o ranking de equipe.',
  },
  {
    q: 'E se eu não souber configurar?',
    a: 'Você recebe 8 aulas práticas mostrando o uso do sistema e conta com suporte. A configuração foi pensada para ser simples.',
  },
  {
    q: 'E se eu não gostar?',
    a: 'Você tem 7 dias após a compra para pedir reembolso. A Hotmart devolve o valor da compra.',
  },
]

export default function FAQ() {
  return (
    <section className="bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-9 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#B77916]">Antes de comprar</p>
          <h2 className="text-3xl font-bold tracking-[-0.025em] text-[#101828] sm:text-4xl">Dúvidas frequentes</h2>
        </div>

        <div className="rounded-2xl border border-[#DDE1E6] bg-white px-5 shadow-sm sm:px-7">
          {perguntas.map((pergunta) => (
            <details key={pergunta.q} className="group border-b border-[#E7EAEE] last:border-0">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-[#101828] transition-colors hover:text-[#9A650F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B77916] [&::-webkit-details-marker]:hidden">
                <span>{pergunta.q}</span>
                <span aria-hidden="true" className="shrink-0 text-xl text-[#B77916] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 pr-8 text-base leading-relaxed text-[#667384]">{pergunta.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
