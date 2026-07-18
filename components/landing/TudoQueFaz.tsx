const beneficios = [
  { icon: '📱', titulo: 'Clareza para cada barbeiro', texto: 'Link individual, sem senha, com meta, ritmo, comissão e ranking.' },
  { icon: '🏆', titulo: 'Metas que viram jogo', texto: 'Bronze, Prata e Ouro, meta coletiva e campanha de pontos.' },
  { icon: '⚡', titulo: 'Operação simples', texto: 'Lançamento diário em uma tela e cards prontos para o WhatsApp.' },
  { icon: '👥', titulo: 'Para equipe ou autônomo', texto: 'O sistema se adapta a quem tem equipe e a quem trabalha sozinho.' },
  { icon: '🎓', titulo: 'Aprendizado incluso', texto: '6 aulas curtas e tutoriais em vídeo dentro do dashboard.' },
  { icon: '♾️', titulo: 'Sem mensalidade', texto: 'Pagamento único, acesso para a equipe e atualizações vitalícias.' },
]

export default function TudoQueFaz() {
  return (
    <section className="border-y border-white/10 bg-[#0A1929] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Benefícios</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Menos cobrança. Mais clareza para a equipe.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficios.map((item) => (
            <article key={item.titulo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span aria-hidden="true" className="text-2xl">{item.icon}</span>
              <h3 className="mt-3 font-bold text-white">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A0AEC0]">{item.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
