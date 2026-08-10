const beneficios = [
  'Avisos e novidades de cada atualização',
  'Troca de experiências com outros donos',
  'Dicas práticas de gestão e vendas',
  'Suporte humanizado quando você precisar',
]

export default function Comunidade() {
  return (
    <section id="comunidade" className="scroll-mt-20 bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[.92fr_1.08fr] lg:gap-12">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#25D366]">Comunidade ativa no WhatsApp</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">Você não assina e fica tentando descobrir tudo sozinho.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            A assinatura aproxima você de quem criou o sistema e de outros donos de barbearia que estão aplicando o BarberMeta no dia a dia.
          </p>
          <ul className="mt-7 space-y-3.5">
            {beneficios.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#D6DEE8] sm:text-base">
                <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-xs font-black text-[#062411]">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#25D366]/25 bg-gradient-to-br from-[#0E2E1F] to-[#0C1824] p-5 shadow-2xl sm:p-7">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#25D366]/15 blur-3xl" />
          <div className="relative mx-auto max-w-md rounded-[24px] border border-white/10 bg-[#0B1411] p-4 shadow-xl sm:p-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-xl">💬</span>
              <div>
                <p className="font-bold text-white">Comunidade BarberMeta</p>
                <p className="mt-0.5 text-xs text-[#8DCA9F]">clientes e suporte online</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="mr-10 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/80">
                Pessoal, como vocês estão usando a Brindoleta no atendimento?
              </div>
              <div className="ml-10 rounded-2xl rounded-tr-sm bg-[#155D32] px-4 py-3 text-sm leading-relaxed text-white">
                Deixei o QR Code no espelho e a equipe já começou a oferecer serviços extras 🙌
              </div>
              <div className="mr-6 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/80">
                Se precisar, chama aqui. A gente ajuda na configuração e compartilha as próximas melhorias.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/35">
              Digite uma mensagem...
              <span className="ml-auto text-[#25D366]">➤</span>
            </div>
          </div>
          <p className="relative mt-4 text-center text-xs leading-relaxed text-white/45">O acesso à comunidade é informado aos assinantes após a confirmação da compra.</p>
        </div>
      </div>
    </section>
  )
}
