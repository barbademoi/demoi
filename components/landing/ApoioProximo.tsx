/**
 * COMUNIDADE + SUPORTE, numa seção só.
 *
 * Eram duas seções longas dizendo a mesma coisa por ângulos diferentes: "você
 * não fica sozinho". Duas vezes o mesmo argumento não convence duas vezes —
 * cansa, e o dono passa rolando pelas duas.
 *
 * Aqui viram três cartões curtos. É a última objeção antes do clique, e ela é
 * silenciosa: ninguém escreve "e se eu travar?", a pessoa só fecha a página.
 * Por isso a resposta é específica em vez de adjetivada — "suporte de
 * qualidade" não significa nada, "você fala com gente, no mesmo dia" é uma
 * promessa que dá pra cobrar.
 */

const APOIOS = [
  {
    emoji: '🎓',
    titulo: 'Aulas dentro do app',
    texto: 'Curtas e direto ao ponto, ensinando a montar cada meta — coletiva, individual, de produtos, de serviços extras e de assinaturas. Ninguém trava por falta de onde digitar; trava por não saber que número colocar.',
    cor: 'border-latao/30 bg-latao/[0.07]',
  },
  {
    emoji: '💬',
    titulo: 'Comunidade ativa no WhatsApp',
    texto: 'Mais de 600 donos trocando o que deu certo: campanha que funcionou, prêmio que engajou, oferta que vendeu. Uma dúvida sua pode virar ação aplicada no mesmo dia.',
    cor: 'border-[#25D366]/30 bg-[#25D366]/[0.07]',
  },
  {
    emoji: '🤝',
    titulo: 'Suporte individualizado e humanizado',
    texto: 'Você fala com gente, não com robô nem número de protocolo. Resposta no mesmo dia, de quem conhece barbearia — e a ajuda inclui pensar junto qual meta colocar, não só consertar o que quebrou.',
    cor: 'border-[#36BFFA]/30 bg-[#36BFFA]/[0.07]',
  },
]

export default function ApoioProximo() {
  return (
    <section id="suporte" className="scroll-mt-20 bg-carvao px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            Você não compra e se vira sozinho.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#C6D0DD]">
            A maior parte das ferramentas te vende e some. Aqui a compra é o começo da conversa.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {APOIOS.map((a) => (
            <article key={a.titulo} className={`rounded-2xl border p-5 sm:p-6 ${a.cor}`}>
              <span aria-hidden="true" className="text-2xl">{a.emoji}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug text-white">{a.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C6D0DD]">{a.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
