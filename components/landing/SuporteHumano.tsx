/**
 * SUPORTE HUMANIZADO — a objeção do pós-compra.
 *
 * "E se eu travar?" é o último medo antes do clique, e é o mais silencioso:
 * ninguém escreve isso no WhatsApp, a pessoa simplesmente fecha a página. Quem
 * já foi atendido por robô de ticket sabe o que é ficar dois dias esperando uma
 * resposta que não resolve.
 *
 * A seção responde com especificidade, não com adjetivo. "Suporte de qualidade"
 * não significa nada — "você fala com gente, não com robô" e "a gente configura
 * junto com você na primeira semana" são promessas que dá pra cobrar.
 *
 * Fica DEPOIS do preço de propósito: é a última coisa que a pessoa lê antes de
 * decidir, e é ela que tira o peso de "vou comprar e me virar sozinho".
 */

const PILARES = [
  {
    emoji: '👤',
    titulo: 'Você fala com gente',
    texto: 'Nada de robô, número de protocolo ou fila de atendimento. Você manda mensagem e uma pessoa responde entendendo o seu caso.',
    cor: 'bg-[#36BFFA]/12 border-[#36BFFA]/30 text-[#36BFFA]',
  },
  {
    emoji: '🎯',
    titulo: 'Ajuda pra configurar, não só pra consertar',
    texto: 'Dúvida sobre qual meta colocar, quanto premiar, que oferta pôr na Brindoleta? A gente pensa junto — isso é parte do suporte, não favor.',
    cor: 'bg-[#D8FF00]/12 border-[#D8FF00]/30 text-[#D8FF00]',
  },
  {
    emoji: '⚡',
    titulo: 'Resposta no mesmo dia',
    texto: 'Barbearia não pode ficar parada esperando. Se travou algo no meio do movimento, você é atendido no mesmo dia.',
    cor: 'bg-[#FF4FA3]/12 border-[#FF4FA3]/30 text-[#FF4FA3]',
  },
  {
    emoji: '🤝',
    titulo: 'Quem atende conhece barbearia',
    texto: 'Você não precisa explicar o que é comissão, comanda ou fechamento de mês. Já sabemos — a conversa começa no problema, não no vocabulário.',
    cor: 'bg-[#9B6CFF]/12 border-[#9B6CFF]/30 text-[#9B6CFF]',
  },
]

export default function SuporteHumano() {
  return (
    <section id="suporte" className="scroll-mt-20 bg-carvao-2 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#36BFFA]">
            Suporte individualizado e humanizado
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            Você não vai comprar e se virar sozinho.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#C6D0DD]">
            A maior parte das ferramentas te vende e some. Aqui é o contrário: a compra é o
            começo da conversa.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PILARES.map((p) => (
            <article
              key={p.titulo}
              className={`rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 sm:p-6 ${p.cor}`}
            >
              <span aria-hidden="true" className="text-2xl">{p.emoji}</span>
              <h3 className="mt-3 text-lg font-bold text-white">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C6D0DD]">{p.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
