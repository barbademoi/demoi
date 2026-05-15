import ComprarForm from './ComprarForm'

export const metadata = {
  title: 'Comprar BarberMeta — Acesso Vitalício',
  description: 'Acesso vitalício ao BarberMeta por R$ 47. Pagamento único, sem mensalidade.',
}

interface Props {
  searchParams: { erro?: string }
}

const INCLUI = [
  'Dashboard com ranking dos barbeiros',
  'Metas Bronze, Prata e Ouro por barbeiro',
  'Link individual — sem senha, sem app',
  'Sistema de pontos e gamificação',
  'Treinamentos em vídeo incluídos',
  'Suporte por email',
]

export default function ComprarPage({ searchParams }: Props) {
  const erroParam = searchParams.erro === '1'
    ? 'O pagamento não foi concluído. Tente novamente.'
    : undefined

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-text mb-1">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Gestão de metas para barbearias
          </p>
        </div>

        {/* Card produto */}
        <div className="card p-6 mb-4">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-serif text-lg text-text">Acesso Vitalício</p>
            <div className="text-right">
              <p className="font-bold text-2xl text-text">R$ 47</p>
              <p className="text-xs text-text-muted font-sans">pagamento único</p>
            </div>
          </div>

          <ul className="space-y-2 mb-0">
            {INCLUI.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-sans text-text-muted">
                <span className="text-primary shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="card p-6">
          <ComprarForm erro={erroParam} />
        </div>

        {/* Já tem conta */}
        <p className="text-center text-xs text-text-muted font-sans mt-5">
          Já é cliente?{' '}
          <a href="/login" className="text-primary hover:text-white transition-colors">
            Acessar minha conta →
          </a>
        </p>
      </div>
    </main>
  )
}
