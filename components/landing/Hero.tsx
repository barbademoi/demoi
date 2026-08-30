import CTAButton from './CTAButton'

/**
 * HERO — o reposicionamento mora aqui.
 *
 * "Sistema" é uma palavra cara: quem ouve pensa em implantação, treinamento,
 * migrar dados, trocar a agenda que já usa. Metade dos donos desiste na
 * palavra, antes de saber o que a ferramenta faz.
 *
 * MiniApp de performance diz outra coisa: é leve, abre no celular, entra por
 * cima do que já existe e começa a funcionar hoje. Mesma ferramenta, medo
 * removido — e o medo é o que estava travando a compra.
 *
 * As três provas embaixo do CTA são as três respostas que a pessoa dá pra si
 * mesma antes de clicar: "é grande o suficiente?", "vou ficar sozinho?",
 * "e se não der certo?".
 */

const PROVAS = [
  { icone: '🏆', texto: '+600 barbearias' },
  { icone: '💬', texto: 'Comunidade ativa no WhatsApp' },
  { icone: '🛡️', texto: '30 dias de garantia' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-carvao px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
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

        <h1 className="text-balance text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.65rem]">
          Não é mais um sistema pra você aprender.{' '}
          <span className="text-latao">É um MiniApp que faz sua equipe vender hoje.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#C6D0DD] sm:mt-6 sm:text-lg">
          Abre no celular, entra por cima da agenda que você já usa e transforma meta em
          ação todo dia. Sem instalar nada, sem migrar nada, sem treinamento.
        </p>

        <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3">
          <CTAButton label="Quero ativar meu MiniApp" id="cta-hero-planos" gtmClass="gtm-cta-hero" />
          <p className="text-sm font-semibold text-[#C6D0DD]">
            1 ano completo por R$ 97 · pagamento único
          </p>
        </div>

        <ul className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
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
