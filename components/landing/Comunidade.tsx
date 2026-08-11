const beneficios = [
  'Ações de vendas que outros donos já colocaram em prática',
  'Ideias para metas, campanhas, premiações e uso da Brindoleta',
  'Novidades do BarberMeta explicadas de forma simples',
  'Suporte humanizado para não deixar você travado',
]

export default function Comunidade() {
  return (
    <section id="comunidade" className="scroll-mt-20 overflow-hidden bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#25D366]">Comunidade ativa no WhatsApp</p>
            <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
              Mais de 600 barbearias aprendendo, aplicando e crescendo juntas.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
              O poder do BarberMeta não está só nas telas. Ele transforma metas em ações diárias da equipe e aproxima você de donos que já colocaram campanhas, premiações e novas formas de vender em prática.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#8FA0B3] sm:text-base">
              Na comunidade, uma dúvida pode virar uma ideia aplicada no mesmo dia. Você acompanha experiências reais, aprende com quem vive os mesmos desafios e conta com ajuda para usar melhor cada ferramenta.
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
                <p className="mt-0.5 text-xs text-[#8DCA9F]">600+ barbearias, troca e suporte</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="mr-10 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/80">
                Como faço a equipe oferecer mais sem deixar o atendimento forçado?
              </div>
              <div className="ml-10 rounded-2xl rounded-tr-sm bg-[#155D32] px-4 py-3 text-sm leading-relaxed text-white">
                Crie uma campanha curta e deixe o QR da Brindoleta no espelho. O cliente participa e a oferta entra na conversa com naturalidade. 🙌
              </div>
              <div className="mr-6 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/80">
                Depois acompanhe no painel o que foi aceito e use a meta para manter a equipe envolvida.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/35">
              Digite uma mensagem...
              <span className="ml-auto text-[#25D366]">➤</span>
            </div>
          </div>
          <p className="relative mt-4 text-center text-xs leading-relaxed text-white/45">O acesso à comunidade é enviado aos assinantes após a confirmação da compra.</p>
          </div>
        </div>

      </div>
    </section>
  )
}
