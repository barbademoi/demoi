import CTAButton from './CTAButton'

/**
 * A LISTA COMPLETA — pra não sobrar dúvida do que o dono leva.
 *
 * Página de venda costuma falar de benefício e esconder a lista. Aqui é o
 * contrário, de propósito: o dono de barbearia já foi enrolado por promessa
 * bonita, e o que tira a última dúvida dele é ver o inventário, item por item,
 * agrupado por assunto.
 *
 * Os grupos seguem a ordem em que ele pensa no negócio: primeiro as metas
 * (que é o que ele veio buscar), depois o time, depois o dinheiro, depois o
 * cliente, e por último o apoio que ele recebe.
 *
 * Substituiu duas seções que diziam a mesma coisa em lugares diferentes da
 * página. Uma lista boa uma vez vale mais do que meia lista duas vezes.
 */

const GRUPOS = [
  {
    titulo: 'Metas que a equipe entende',
    cor: 'text-latao',
    borda: 'border-latao/25',
    itens: [
      'Meta coletiva da barbearia, com Bronze, Prata e Ouro',
      'Meta individual de cada barbeiro',
      'Meta de venda de produtos',
      'Meta de serviços extras',
      'Meta de assinaturas',
      'Ritmo diário: quanto falta e quanto precisa fazer por dia',
      'Comparativo com o mesmo ponto do mês passado',
    ],
  },
  {
    titulo: 'Time motivado o mês inteiro',
    cor: 'text-[#D8FF00]',
    borda: 'border-[#D8FF00]/25',
    itens: [
      'Link individual: cada barbeiro vê os números dele no celular',
      'Ranking da equipe, com disputa saudável',
      'Campanhas de pontos e premiação',
      'Prêmio por nível batido, calculado sozinho',
      'Acompanhamento de conduta e comportamento',
      'Cards prontos pra postar o resultado do time',
    ],
  },
  {
    titulo: 'Controle do dinheiro',
    cor: 'text-[#64E3BA]',
    borda: 'border-[#64E3BA]/25',
    itens: [
      'Financeiro: o que entra, o que sai e o que sobra',
      'Lançamento diário do faturamento, em 2 minutos',
      'Fechamento de mês e histórico guardado',
      'Ticket médio e número de atendimentos',
    ],
  },
  {
    titulo: 'Mais venda no balcão',
    cor: 'text-[#FF8BBE]',
    borda: 'border-[#FF4FA3]/25',
    itens: [
      'Brindoleta: a roleta de brindes no QR Code de cada barbeiro',
      'Feedback Premiado: avaliação do cliente virando brinde',
      'Ofertas e produtos que você mesmo escolhe',
    ],
  },
  {
    titulo: 'Você não fica sozinho',
    cor: 'text-[#74A4FF]',
    borda: 'border-[#74A4FF]/25',
    itens: [
      'Aulas dentro do app ensinando a montar cada meta',
      'Comunidade ativa no WhatsApp com +600 donos',
      'Suporte humanizado: gente de verdade, no mesmo dia',
      'Reunião de equipe com pauta pronta',
    ],
  },
]

export default function OQueTem() {
  return (
    <section id="incluso" className="scroll-mt-20 bg-carvao-2 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-latao">
            Tudo entra junto · um pagamento só
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            O que você leva, item por item.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#C6D0DD]">
            Sem módulo à parte, sem plano básico, sem upgrade pra desbloquear.
            Está nesta lista, está no seu MiniApp desde o primeiro dia.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {GRUPOS.map((g) => (
            <article key={g.titulo} className={`rounded-2xl border bg-carvao p-5 sm:p-6 ${g.borda}`}>
              <h3 className={`text-sm font-black uppercase tracking-[0.1em] ${g.cor}`}>{g.titulo}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#D6DEE8]">
                    <span aria-hidden="true" className={`mt-px shrink-0 font-bold ${g.cor}`}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <CTAButton label="Quero 1 ano por R$ 97" id="cta-incluso-planos" gtmClass="gtm-cta-incluso" />
          <p className="text-xs text-white/50">Pagamento único · garantia de 30 dias · sem renovação automática</p>
        </div>
      </div>
    </section>
  )
}
