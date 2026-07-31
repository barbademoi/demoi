import Image from 'next/image'

export default function ProvasSocial() {
  return (
    <section className="bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <article className="overflow-hidden rounded-3xl bg-[#101828] text-white shadow-xl shadow-black/10">
          <div className="grid lg:grid-cols-[.72fr_1.28fr] lg:items-center">
            <div className="relative mx-auto w-full max-w-[360px] self-end px-7 pt-7 lg:px-8 lg:pt-10">
              <Image
                src="/prints/foto-pensativo.png"
                width={400}
                height={500}
                alt="Carlos Henrique, dono da Demôi Barbearia e criador do BarberMeta"
                sizes="(max-width: 1024px) 320px, 330px"
                className="block h-auto w-full rounded-t-2xl"
              />
            </div>
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Criado dentro de uma barbearia</p>
              <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Eu precisava parar de cobrar minha equipe todo dia.</h2>
              <p className="mt-5 text-base leading-relaxed text-[#C6D0DD] sm:text-lg">
                Sou Carlos Henrique, dono da Demôi Barbearia em Cássia/MG, com 7 barbeiros. Criei o BarberMeta para resolver esse problema na minha própria operação. Primeiro funcionou aqui. Depois, compartilhei com outros donos.
              </p>
              <p className="mt-5 text-sm font-bold text-white">Carlos Henrique <span className="font-normal text-[#9DACBD]">· Demôi Barbearia</span></p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
