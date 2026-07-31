import Image from 'next/image'
import CTAButton from './CTAButton'

export default function CTAFinal() {
  return (
    <section className="overflow-hidden bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-9 lg:grid-cols-[1fr_260px] lg:gap-14">
        <div className="text-center lg:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Meta visível. Time em movimento.</p>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-4xl lg:text-5xl">
            Pare de carregar a meta sozinho.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C3D1] sm:text-lg lg:mx-0">
            Coloque o progresso na mão de cada barbeiro e dê para sua equipe um motivo claro para acelerar todos os dias.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 lg:items-start">
            <CTAButton label="Quero o BarberMeta — R$ 47" id="cta-final-oferta" gtmClass="gtm-cta-final" />
            <p className="text-sm text-[#8FA0B3]">Pagamento único · acesso vitalício · 7 dias de garantia</p>
          </div>
        </div>

        <div className="mx-auto w-48 lg:w-[260px]">
          <Image src="/prints/foto-apontando.png" width={576} height={720} alt="Carlos Henrique apresentando o BarberMeta" sizes="(max-width: 1024px) 192px, 260px" className="h-auto w-full rounded-2xl shadow-2xl" />
        </div>
      </div>
    </section>
  )
}
