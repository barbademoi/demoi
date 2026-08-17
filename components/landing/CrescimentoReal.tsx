import CTAButton from './CTAButton'
import LandingIcon from './LandingIcon'
import CrescimentoCarousel from './CrescimentoCarousel'

const sinais = [
  { icon: 'chart' as const, texto: 'Comparação entre meses fechados', cor: 'text-[#64E3BA]', fundo: 'bg-[#64E3BA]/10' },
  { icon: 'check' as const, texto: 'Números registrados no sistema', cor: 'text-[#74A4FF]', fundo: 'bg-[#1E63E9]/15' },
  { icon: 'team' as const, texto: 'Imagem publicada com autorização', cor: 'text-[#FFD16A]', fundo: 'bg-[#F4B942]/10' },
]

const resultados = [
  { src: '/prints/crescimento/andrades-barbershop.png', nome: "Andrade's Barbershop" },
  { src: '/prints/crescimento/conexao-barbers.png', nome: 'Conexão Barbers' },
  { src: '/prints/crescimento/demoi-barbearia.png', nome: 'Demôi Barbearia' },
  { src: '/prints/crescimento/grupo-facility.png', nome: 'Grupo Facility' },
  { src: '/prints/crescimento/kane-barber-club.png', nome: 'Kane Barber Club' },
  { src: '/prints/crescimento/legadum-barbearia.png', nome: 'Legadum Barbearia' },
  { src: '/prints/crescimento/ricci-barbearia.png', nome: 'Ricci Barbearia' },
  { src: '/prints/crescimento/st-bryts-barber-club.png', nome: 'St. Bryts Barber Club' },
  { src: '/prints/crescimento/suten-barbearia.png', nome: 'Suten Barbearia' },
]

export default function CrescimentoReal() {
  return (
    <section className="relative overflow-hidden bg-carvao px-4 py-16 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      <div aria-hidden="true" className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-vermelho-poste/12 blur-[120px]" />
      <div aria-hidden="true" className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-verde-acao/12 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#64E3BA]/30 bg-[#64E3BA]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#64E3BA]">
              <span className="h-2 w-2 rounded-full bg-[#64E3BA] shadow-[0_0_12px_#64E3BA]" aria-hidden="true" />
              Dados reais do BarberMeta
            </span>
            <h2 className="mt-5 max-w-3xl text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Crescimento que o dono consegue{' '}
              <span className="text-[#64E3BA]">ver nos próprios números.</span>
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            Nove operações reais e a evolução entre meses fechados.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {sinais.map((sinal) => (
            <div key={sinal.texto} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sinal.fundo} ${sinal.cor}`}>
                <LandingIcon name={sinal.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold leading-snug text-white">{sinal.texto}</span>
            </div>
          ))}
        </div>

        <figure className="mt-6 overflow-hidden rounded-[26px] border border-white/15 bg-[#101319] py-4 shadow-2xl shadow-black/50 sm:py-5">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.035] px-4 py-3 sm:px-5">
            <span className="text-xs font-bold text-white">Crescimento real de barbearias que usam o BarberMeta</span>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#64E3BA]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64E3BA] shadow-[0_0_10px_#64E3BA]" aria-hidden="true" />
              Rolagem automática
            </span>
          </figcaption>

          <CrescimentoCarousel resultados={resultados} />
        </figure>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B3]">
          Arraste para ver mais · a rolagem automática retoma sozinha
        </p>

        {/* Case em destaque. O valor deste exemplo não é o número em si — é o
            contraste: cidade pequena e ticket baixo chegando nesse faturamento.
            É o que responde ao "aqui não funciona, minha cidade é pequena". */}
        <article className="mt-8 overflow-hidden rounded-[26px] border border-verde-acao/25 bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-verde-acao/[0.07] px-5 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-verde-acao">Case real</span>
            <span className="text-xs font-bold text-white">Demôi Barbearia · julho/2026</span>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[#B8C3D1]">Faturamento bruto no mês</p>
              <p className="mt-1 font-serif text-4xl font-bold leading-none text-verde-acao sm:text-5xl">R$ 58.582,80</p>

              <dl className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['Serviços', 'R$ 25.781,40'],
                  ['Produtos', 'R$ 1.428,50'],
                  ['Assinaturas', 'R$ 31.372,90'],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8FA0B3]">{rotulo}</dt>
                    <dd className="mt-0.5 text-sm font-bold text-white">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="text-lg font-bold leading-snug text-white sm:text-xl">
                Cidade de 17 mil habitantes. Corte a R$ 38. Resultado: R$ 58 mil no mês.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#B8C3D1]">
                Não precisa ser capital nem ticket alto. Precisa de equipe enxergando a meta.
              </p>

              <blockquote className="mt-4 border-l-2 border-vermelho-poste pl-4">
                <p className="text-sm italic leading-relaxed text-[#D6DEE8]">
                  &ldquo;O BarberMeta faz a equipe engajar e querer bater as metas, usando as ferramentas
                  do sistema pra ajudar nas vendas.&rdquo;
                </p>
                <cite className="mt-2 block text-xs font-bold not-italic text-white">
                  Carlos Henrique · Demôi Barbearia
                </cite>
              </blockquote>
            </div>
          </div>
        </article>

        <div className="mt-7 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#F4B942]/25 bg-gradient-to-r from-[#F4B942]/10 via-[#1E63E9]/10 to-[#64E3BA]/10 p-5 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="text-lg font-bold text-white">Sua equipe vê o caminho. Você acompanha a evolução.</p>
            <p className="mt-1 text-sm leading-relaxed text-[#B8C3D1]">Aplique com sua equipe e acompanhe a evolução dentro do sistema.</p>
          </div>
          <CTAButton label="Quero aplicar na minha barbearia" id="cta-crescimento-planos" gtmClass="gtm-cta-crescimento" />
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#718095] sm:text-xs">
          Resultados variam conforme equipe, operação e execução. A comparação exibida não representa promessa de resultado futuro.
        </p>
      </div>
    </section>
  )
}
