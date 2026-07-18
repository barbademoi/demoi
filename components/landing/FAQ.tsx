const perguntas = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. Funciona no navegador, no celular, computador ou tablet. Você recebe um login por email depois da compra.' },
  { q: 'Como cada barbeiro acessa? Eles vão saber mexer?', a: 'Cada barbeiro recebe um link único, sem conta e sem senha. Quem usa WhatsApp consegue usar: é só abrir no celular e ver os próprios números.' },
  { q: 'Posso adicionar barbeiros ou recepcionistas depois?', a: 'Sim. Você pode cadastrar barbeiros e recepcionistas, cada um com sua meta e seu link próprio, quantos quiser e sem custo extra.' },
  { q: 'Funciona para quem trabalha sozinho?', a: 'Sim. Na primeira vez, o sistema pergunta se você tem equipe ou trabalha sozinho. No modo autônomo, você vê suas metas, histórico mês a mês e progresso sem ranking de equipe.' },
  { q: 'E se eu não souber configurar?', a: 'Depois da compra, você recebe acesso aos vídeos de treinamento e suporte direto no WhatsApp (35) 99824-8211. Em 30 minutos você está com tudo rodando.' },
  { q: 'A Hotmart cobra imposto ou taxa extra?', a: 'Não. O preço de R$ 47 é o valor final. Sem taxa, sem cobrança recorrente e sem surpresa.' },
  { q: 'E se eu não gostar?', a: 'Você tem 7 dias após a compra para pedir reembolso. Manda mensagem no WhatsApp do suporte e a Hotmart devolve o valor cheio, sem pergunta.' },
]

export default function FAQ() {
  return (
    <section className="bg-[#0F1F2D] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">FAQ</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Dúvidas frequentes</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0A1929] px-5 sm:px-7">
          {perguntas.map((pergunta) => (
            <details key={pergunta.q} className="group border-b border-white/10 last:border-0">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-white transition-colors hover:text-[#D4A85A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A85A] [&::-webkit-details-marker]:hidden">
                <span>{pergunta.q}</span>
                <span aria-hidden="true" className="shrink-0 text-xl text-[#D4A85A] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 pr-8 text-base leading-relaxed text-[#A0AEC0]">{pergunta.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
