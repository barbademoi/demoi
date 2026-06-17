import Link from 'next/link'

export const metadata = {
  title: 'Controle Financeiro da sua barbearia',
  description:
    'Caixa, contas a pagar e receber, folha da equipe e quanto sobra no mês — num lugar só. Pagamento único, sem mensalidade.',
}

const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_HOTMART_URL || 'https://pay.hotmart.com/P106317414B'

const RECURSOS = [
  {
    titulo: 'Caixa e fluxo',
    texto: 'Tudo o que entra e sai, organizado por mês. Veja na hora quanto sobrou.',
  },
  {
    titulo: 'Contas a pagar e a receber',
    texto: 'Lançamentos fixos, parcelados ou avulsos. Marque como pago num clique.',
  },
  {
    titulo: 'Folha da equipe',
    texto: 'Comissões, descontos e bônus por colaborador — com card de pagamento pra enviar.',
  },
  {
    titulo: 'Empresa e pessoal',
    texto: 'Separe as finanças da barbearia das suas. Cada uma com seu resultado.',
  },
  {
    titulo: 'Salvo na nuvem',
    texto: 'Seus dados sincronizam entre celular e computador, sem planilha solta.',
  },
  {
    titulo: 'Pagamento único',
    texto: 'Sem mensalidade. Comprou, liberou — e é seu pra sempre.',
  },
]

export default function OfertaPage() {
  return (
    <main className="min-h-screen">
      {/* Topo */}
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-[1.5px] text-primary uppercase">
            Controle Financeiro
          </div>
          <Link href="/entrar" className="text-sm font-semibold text-ink-soft hover:text-ink transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-16 pb-12 text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          O financeiro da sua barbearia,{' '}
          <span className="text-primary">sem planilha bagunçada</span>.
        </h1>
        <p className="text-ink-soft text-lg mt-5 leading-relaxed">
          Caixa, contas a pagar e receber, comissão da equipe e quanto sobra no mês —
          tudo num lugar só, no celular ou no computador.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full sm:w-auto text-base px-8 py-4"
          >
            Desbloquear agora
          </a>
          <Link href="/cadastro" className="btn-secondary w-full sm:w-auto">
            Criar minha conta
          </Link>
        </div>
        <p className="text-faint text-sm mt-4">
          Pagamento único, sem mensalidade. Liberação automática após a compra.
        </p>
      </section>

      {/* Recursos */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="card p-6">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold mb-3">
                ✓
              </div>
              <h3 className="font-semibold text-ink">{r.titulo}</h3>
              <p className="text-ink-soft text-sm mt-1.5 leading-relaxed">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <div className="card p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Pare de adivinhar quanto sobra no fim do mês</h2>
          <p className="text-ink-soft mt-3 leading-relaxed">
            Em poucos minutos você tem o caixa da barbearia organizado e sob controle.
          </p>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6 text-base px-8 py-4"
          >
            Quero desbloquear
          </a>
          <p className="text-faint text-sm mt-4">
            Já comprou?{' '}
            <Link href="/entrar" className="text-primary font-medium hover:underline">
              Entre aqui
            </Link>
            . Se comprou com um email diferente do login, fale com o suporte.
          </p>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 py-6 text-center text-faint text-xs">
          Controle Financeiro · Demoi
        </div>
      </footer>
    </main>
  )
}
