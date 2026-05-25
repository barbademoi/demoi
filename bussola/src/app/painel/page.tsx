import Link from 'next/link'

export default function PainelPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-3">Bem-vindo!</h1>
      <p className="text-text-muted mb-8">Em breve mais funcionalidades.</p>
      <Link href="/painel/profissionais" className="btn-primary">
        Gerenciar profissionais
      </Link>
    </main>
  )
}
