import CTAButton from './CTAButton'

/**
 * ANCORAGEM DE VALOR — o que faz R$ 97 parecer barato.
 *
 * R$ 97 sozinho não é caro nem barato: é um número solto. Ele só vira "barato"
 * quando encosta em outro número que a pessoa já tem na cabeça. Por isso a
 * âncora aqui é o CORTE, não um concorrente: todo dono sabe de cor quanto cobra
 * por um corte, e "dois cortes pelo ano inteiro" é uma conta que ele faz
 * sozinho, em silêncio, e da qual acredita mais do que de qualquer promessa
 * que eu escreva.
 *
 * A lista empilha o que entra junto. Não inventei valor de mercado pra cada
 * item — número inventado numa tabela é o tipo de coisa que o dono percebe, e
 * quando percebe, para de acreditar no resto da página. A força aqui é a
 * QUANTIDADE de coisas incluídas contra um preço único.
 *
 * O custo de inação fecha a seção. Não é ameaça nem contador falso: é a conta
 * real de deixar a equipe sem meta por mais um mês.
 */

const ENTREGAS = [
  { emoji: '🎁', titulo: 'Brindoleta', desc: 'A roleta de vendas no QR Code de cada barbeiro' },
  { emoji: '🎯', titulo: 'Metas e ranking', desc: 'Individual, coletiva, com Bronze, Prata e Ouro' },
  { emoji: '🏆', titulo: 'Campanhas e premiação', desc: 'Pontos, prêmios e disputa saudável no time' },
  { emoji: '💰', titulo: 'Financeiro', desc: 'O que entra, o que sai e o que sobra' },
  { emoji: '⭐', titulo: 'Feedback Premiado', desc: 'Avaliação do cliente virando brinde e reputação' },
  { emoji: '📱', titulo: 'Link individual', desc: 'Cada barbeiro acompanha os números dele no celular' },
  { emoji: '💬', titulo: 'Comunidade no WhatsApp', desc: 'Mais de 600 donos trocando o que funciona' },
  { emoji: '🎓', titulo: '8 aulas práticas', desc: 'Direto ao ponto, sem enrolação' },
  { emoji: '🤝', titulo: 'Suporte humanizado', desc: 'Gente de verdade, no mesmo dia' },
]

export default function StackValor() {
  return (
    <section className="relative overflow-hidden bg-carvao px-4 py-16 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-latao/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-latao">
            O que entra no seu MiniApp
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            Tudo isso junto. Um pagamento só.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#C6D0DD]">
            Não tem módulo vendido à parte, plano básico nem &ldquo;upgrade pra desbloquear&rdquo;.
            Entra tudo, no primeiro dia.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENTREGAS.map((e) => (
            <li
              key={e.titulo}
              className="rounded-2xl border border-carvao-3 bg-carvao-2 p-4 transition-transform hover:-translate-y-0.5 hover:border-latao/30"
            >
              <span aria-hidden="true" className="text-xl">{e.emoji}</span>
              <p className="mt-2 font-bold text-white">{e.titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9DACBD]">{e.desc}</p>
            </li>
          ))}
        </ul>

        {/* A ÂNCORA. O dono sabe de cor quanto cobra por um corte — é ele que
            faz a conta, e é por isso que ela convence. */}
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-latao/35 bg-latao/[0.07] p-6 text-center sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-latao">Faça a conta</p>
          <p className="mt-3 text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
            Dois cortes pagam o ano inteiro de MiniApp.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#C6D0DD] sm:text-base">
            Se a Brindoleta vender <span className="font-bold text-white">um único produto a mais por semana</span>,
            ela já pagou o BarberMeta várias vezes antes do ano acabar. E ela não vende um por semana —
            vende todo dia, em cada atendimento.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3">
            <CTAButton label="Quero 1 ano por R$ 97" id="cta-stack-planos" gtmClass="gtm-cta-stack" />
            <p className="text-xs text-white/50">Pagamento único · garantia de 30 dias · sem renovação automática</p>
          </div>
        </div>

        {/* CUSTO DE INAÇÃO — a conta de não fazer nada, sem contador falso. */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-white/45">
          Enquanto você decide, o mês corre. Equipe sem meta à vista vende o que aparece —
          e o que não foi oferecido neste mês não volta no próximo.
        </p>
      </div>
    </section>
  )
}
