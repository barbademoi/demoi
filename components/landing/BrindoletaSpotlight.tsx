import BrindoletaDemo from '@/components/brindoleta/BrindoletaDemo'
import CTAButton from './CTAButton'
import LandingIcon, { type LandingIconName } from './LandingIcon'

const beneficios = [
  { texto: 'Um QR Code para cada profissional', icon: 'qr' as LandingIconName, classe: 'bg-[#D8FF00] text-[#11110F]' },
  { texto: 'Você escolhe as ofertas, produtos e brindes', icon: 'gift' as LandingIconName, classe: 'bg-[#FF4FA3] text-white' },
  { texto: 'O dono confirma as vendas que realmente aconteceram', icon: 'check' as LandingIconName, classe: 'bg-[#36BFFA] text-[#061723]' },
  { texto: 'O cliente participa pelo próprio celular', icon: 'phone' as LandingIconName, classe: 'bg-[#9B6CFF] text-white' },
]

export default function BrindoletaSpotlight() {
  return (
    <section id="brindoleta" className="scroll-mt-20 overflow-hidden bg-[#0B0C09] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D8FF00]/30 bg-[#D8FF00]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#D8FF00]">
            Incluída para assinantes
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            A Brindoleta ajuda sua equipe a oferecer mais sem forçar a venda.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            O cliente lê o QR Code do profissional, gira a roleta e descobre uma oferta. Se aceitar, a venda aparece para o dono conferir e fica ligada a quem fez o atendimento.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {beneficios.map((beneficio) => (
              <li key={beneficio.texto} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-sm font-semibold leading-relaxed text-white/85 transition-transform hover:-translate-y-0.5 hover:border-white/20">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-black/20 ${beneficio.classe}`}>
                  <LandingIcon name={beneficio.icon} className="h-5 w-5" />
                </span>
                <span>{beneficio.texto}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col items-start gap-2">
            <CTAButton label="Quero isso na minha equipe" id="cta-brindoleta-planos" gtmClass="gtm-cta-brindoleta" />
            <p className="text-xs text-white/45">A Brindoleta já está incluída para novos assinantes.</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-[#D8FF00]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[#11120E] p-2 shadow-2xl shadow-black/50 sm:p-3">
            <BrindoletaDemo />
          </div>
          <p className="mt-3 text-center text-xs text-white/40">Demonstração animada baseada na experiência real do cliente.</p>
        </div>
      </div>
    </section>
  )
}
