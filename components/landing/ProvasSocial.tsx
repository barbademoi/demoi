export default function ProvasSocial() {
  return (
    <section className="bg-[#0F1F2D] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Minha história</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Funcionou primeiro na minha barbearia.</h2>
        </div>

        <article className="rounded-3xl border border-white/10 bg-[#0A1929] p-6 sm:p-10">
          <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start sm:gap-10">
            <div className="w-36 shrink-0 sm:w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prints/foto-pensativo.png" width="400" height="500" alt="Carlos Henrique, criador do BarberMeta" className="h-auto w-full rounded-2xl shadow-xl" loading="lazy" />
            </div>
            <div>
              <p className="text-base leading-relaxed text-[#E2E8F0] sm:text-lg">
                Sou Carlos Henrique, dono da <strong className="text-white">Demôi Barbearia</strong> em Cássia / MG. Tenho 7 barbeiros.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#A0AEC0]">
                Antes, mandava meta no grupo do WhatsApp e ninguém abria. A cobrança no fim do mês virou rotina chata e a equipe trabalhava no piloto automático.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#A0AEC0]">
                Construí o BarberMeta para resolver isso na minha própria casa. Hoje, minha equipe se cobra sozinha: quem está atrás vê o ranking e corre.
              </p>
              <p className="mt-5 text-sm text-[#A0AEC0]"><strong className="text-white">Carlos Henrique</strong> · Demôi Barbearia · Cássia / MG</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
