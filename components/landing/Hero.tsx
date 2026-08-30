import CTAButton from './CTAButton'

/**
 * HERO.
 *
 * A headline é a promessa que o dono já entende sem explicação: barbeiro que
 * sabe onde está fica motivado o mês inteiro. Não é uma frase sobre software,
 * é sobre a pessoa que trabalha na cadeira — e é por isso que ela funciona.
 *
 * O parágrafo abaixo entrega a resposta pra "e eu vou saber montar isso?"
 * ANTES de qualquer funcionalidade. As aulas dentro do app são o que separa a
 * ferramenta de uma planilha bonita: ninguém trava por não ter onde digitar a
 * meta, trava por não saber que meta colocar.
 *
 * "MiniApp" continua no badge de propósito: é o que tira o peso de "mais um
 * sistema pra implantar", que é a objeção que faz o dono fechar a página.
 */

const PROVAS = [
  { icone: '🏆', texto: '+600 barbearias' },
  { icone: '💬', texto: 'Comunidade no WhatsApp' },
  { icone: '🛡️', texto: '30 dias de garantia' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-carvao px-4 pb-14 pt-24 sm:px-6 sm:pb-18 sm:pt-28 lg:pb-20 lg:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#FF4FA3]/12 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-32 h-80 w-80 rounded-full bg-[#D8FF00]/12 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D8FF00]/40 bg-[#D8FF00]/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.13em] text-[#D8FF00] sm:text-xs">
          <span aria-hidden="true">⚡</span>
          MiniApp de performance para barbearias
        </span>

        <h1 className="text-balance text-[2.35rem] font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.5rem]">
          Barbeiro que sabe onde está fica{' '}
          <span className="text-latao">motivado o mês inteiro.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#C6D0DD] sm:mt-6 sm:text-lg">
          <span className="font-semibold text-white">Dentro do app, eu te ensino em aulas curtas</span>{' '}
          a montar a meta coletiva e a de cada barbeiro, a meta de venda de produtos,
          de serviços extras e de assinaturas — e a acompanhar tudo isso com
          organização, sem planilha e sem complicação.
        </p>

        <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3">
          <CTAButton label="Quero ativar meu MiniApp" id="cta-hero-planos" gtmClass="gtm-cta-hero" />
          <p className="text-sm font-semibold text-[#C6D0DD]">
            1 ano completo por R$ 97 · pagamento único
          </p>
        </div>

        <ul className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {PROVAS.map((p) => (
            <li key={p.texto} className="flex items-center gap-1.5 text-xs font-semibold text-white/55 sm:text-sm">
              <span aria-hidden="true">{p.icone}</span>
              {p.texto}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
