import CTAButton from './CTAButton'

/**
 * QUEBRA DE OBJEÇÃO LOGO NO COMEÇO.
 *
 * A objeção número um nunca é preço: é "não tenho tempo pra implantar mais um
 * sistema". Quem chega aqui já tentou uma planilha que morreu e um software que
 * ninguém abriu. Se a página não desarmar isso nos primeiros trinta segundos,
 * o resto do texto é lido por alguém que já decidiu que não vai dar conta.
 *
 * Por isso a comparação vem antes de qualquer funcionalidade: primeiro tira o
 * peso, depois mostra o que a ferramenta faz. Na ordem inversa, cada
 * funcionalidade nova soa como mais uma coisa pra aprender.
 *
 * O lado esquerdo é escrito com as palavras que o dono usa quando reclama —
 * ele precisa se reconhecer ali pra confiar no lado direito.
 */

const COMPARACAO = [
  { sistema: 'Semanas de implantação', miniapp: 'Ativo em 10 minutos' },
  { sistema: 'Treinar a equipe inteira', miniapp: 'Cada barbeiro abre um link e entende sozinho' },
  { sistema: 'Trocar sua agenda', miniapp: 'Roda por cima da agenda que você já usa' },
  { sistema: 'Instalar, baixar, cadastrar', miniapp: 'Abre no navegador do celular' },
  { sistema: 'Mensalidade que nunca acaba', miniapp: 'Paga uma vez, usa o ano inteiro' },
]

export default function PorQueMiniApp() {
  return (
    <section className="bg-carvao-2 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#FF4FA3]">
            Antes que você pense &ldquo;não tenho tempo pra isso&rdquo;
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            MiniApp não é sistema. Essa diferença é o que faz você usar.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#C6D0DD]">
            Você já tentou planilha que morreu no segundo mês e software que a equipe
            nunca abriu. O BarberMeta foi feito pra ser o contrário disso.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-carvao-3 bg-carvao">
          <div className="grid grid-cols-2 border-b border-carvao-3">
            <p className="px-4 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-xs">
              Sistema comum
            </p>
            <p className="border-l border-carvao-3 bg-[#D8FF00]/[0.07] px-4 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#D8FF00] sm:text-xs">
              MiniApp BarberMeta
            </p>
          </div>

          {COMPARACAO.map((linha) => (
            <div key={linha.miniapp} className="grid grid-cols-2 border-b border-carvao-3 last:border-b-0">
              <p className="flex items-start gap-2 px-4 py-4 text-sm leading-snug text-white/40 line-through decoration-white/20 sm:px-6">
                {linha.sistema}
              </p>
              <p className="flex items-start gap-2 border-l border-carvao-3 bg-[#D8FF00]/[0.04] px-4 py-4 text-sm font-semibold leading-snug text-white sm:px-6">
                <span aria-hidden="true" className="mt-px shrink-0 text-[#D8FF00]">✓</span>
                {linha.miniapp}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <CTAButton label="Quero ativar meu MiniApp" id="cta-miniapp-planos" gtmClass="gtm-cta-miniapp" />
          <p className="text-xs text-white/45">Leva 10 minutos pra colocar sua equipe dentro.</p>
        </div>
      </div>
    </section>
  )
}
