sed: --: No such file or directory
const passos = [
  { num: '1', titulo: 'Você configura', texto: 'Cadastra a equipe, as metas Bronze, Prata e Ouro e a premiação de cada nível.' },
  { num: '2', titulo: 'Cada barbeiro recebe um link', texto: 'Sem app e sem senha. Ele abre no celular e vê comissão, ritmo, metas e ranking.' },
  { num: '3', titulo: 'O time acompanha sozinho', texto: 'Quem está atrás vê quem está na frente. A meta vira jogo e você para de cobrar.' },
]

export default function Solucao() {
  return (
    <section className="bg-[#0F1F2D] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A85A]">Como funciona</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Três passos. Sem complicação.</h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {passos.map((passo) => (
            <li key={passo.num} className="rounded-2xl border border-white/10 bg-[#0A1929] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#D4A85A] bg-[#D4A85A]/10 text-lg font-bold text-[#D4A85A]">{passo.num}</span>
              <h3 className="mt-5 text-xl font-bold text-white">{passo.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#A0AEC0]">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
