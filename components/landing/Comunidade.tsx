const beneficios = [
  'Ações de vendas que outros donos já colocaram em prática',
  'Ideias para metas, campanhas, premiações e uso da Brindoleta',
  'Novidades do BarberMeta explicadas de forma simples',
  'Suporte humanizado para não deixar você travado',
]

const resultados = [
  { valor: '+16%', legenda: 'em uma barbearia' },
  { valor: '+15%', legenda: 'em outra operação' },
  { valor: '+14,5%', legenda: 'em outra equipe' },
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
              O poder do BarberMeta não está só nas telas. Ele transforma metas em ações diárias da equipe e aproxima você de donos que já testaram campanhas, premiações e novas formas de vender.
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

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-7 lg:flex lg:items-center lg:gap-10">
          <div className="lg:max-w-[360px] lg:shrink-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64E3BA]">Resultados registrados no BarberMeta</p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-white">Quando a equipe acompanha, fica mais fácil agir.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#AEBBCB]">
              Há barbearias usando o BarberMeta com crescimento comprovado nos próprios dados. Estes são exemplos reais comparando os dois meses fechados e válidos mais recentes de cada operação.
            </p>
          </div>

          <div className="mt-6 grid flex-1 grid-cols-3 gap-2.5 sm:gap-4 lg:mt-0">
            {resultados.map((resultado) => (
              <div key={resultado.valor} className="rounded-2xl border border-[#64E3BA]/20 bg-[#0A191A] px-2 py-5 text-center sm:px-4">
                <strong className="block font-serif text-3xl leading-none text-[#64E3BA] sm:text-4xl">{resultado.valor}</strong>
                <span className="mt-2 block text-[10px] font-semibold leading-tight text-[#B8C3D1] sm:text-xs">{resultado.legenda}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-[#718095] sm:text-xs">
          Resultados variam conforme equipe, operação e execução. Os percentuais acima não representam promessa de resultado.
        </p>
      </div>
    </section>
  )
}
