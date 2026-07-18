import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import BoasVindasForm from './BoasVindasForm'

interface Props {
  searchParams: {
    // Hotmart
    t?: string
    e?: string
  }
}

export const metadata = {
  title: 'Bem-vindo ao BarberMeta — Crie sua senha',
}

export default async function BoasVindasPage({ searchParams }: Props) {
  // ── Fluxo Hotmart ────────────────────────────────────────────────────────────
  const transaction = (searchParams.t ?? '').trim()
  const email       = decodeURIComponent(searchParams.e ?? '').toLowerCase().trim()

  if (!transaction || !email) {
    return <Layout><LinkInvalido /></Layout>
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (admin as any)
    .from('usuarios')
    .select('senha_definida')
    .eq('email', email)
    .eq('hotmart_transaction', transaction)
    .maybeSingle()

  return (
    <Layout>
      {!usuario ? (
        <ProcessandoHotmart email={email} transaction={transaction} />
      ) : usuario.senha_definida ? (
        <JaDefinida />
      ) : (
        <FormCardHotmart email={email} transaction={transaction} />
      )}
    </Layout>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bm-theme min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text mb-2">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
        </div>
        {children}
      </div>
    </main>
  )
}

// ── Estados Hotmart ──────────────────────────────────────────────────────────

function FormCardHotmart({ email, transaction }: { email: string; transaction: string }) {
  return (
    <div className="card p-8 space-y-6">
      <div>
        <h2 className="font-serif text-xl text-text mb-1">Bem-vindo!</h2>
        <p className="text-text-muted text-sm font-sans leading-relaxed">
          Compra confirmada. Crie uma senha para acessar sua conta.
        </p>
        <p className="mt-2 text-xs text-text-muted font-sans truncate">{email}</p>
      </div>
      <BoasVindasForm email={email} hotmartTransaction={transaction} />
    </div>
  )
}

function ProcessandoHotmart({ email, transaction }: { email: string; transaction: string }) {
  return (
    <div className="card p-8 text-center space-y-4">
      <div className="text-3xl">⏳</div>
      <h2 className="font-serif text-xl text-text">Processando sua compra…</h2>
      <p className="text-text-muted text-sm font-sans leading-relaxed">
        Estamos confirmando seu pagamento. Isso leva menos de um minuto.
      </p>
      <a
        href={`/boas-vindas?t=${transaction}&e=${encodeURIComponent(email)}`}
        className="btn-primary inline-block mt-2"
      >
        Atualizar →
      </a>
    </div>
  )
}

function JaDefinida() {
  return (
    <div className="card p-8 text-center space-y-4">
      <div className="text-3xl">✅</div>
      <h2 className="font-serif text-xl text-text">Conta já configurada</h2>
      <p className="text-text-muted text-sm font-sans">
        Sua senha já foi definida. Acesse com seu email e senha.
      </p>
      <Link href="/login" className="btn-primary inline-block mt-2">
        Ir para o login →
      </Link>
    </div>
  )
}

function LinkInvalido() {
  return (
    <div className="card p-8 text-center space-y-4">
      <div className="text-3xl">⚠️</div>
      <h2 className="font-serif text-xl text-text">Link inválido</h2>
      <p className="text-text-muted text-sm font-sans">
        Este link não é válido. Entre em contato com o suporte.
      </p>
      <a href="mailto:suporte@barbermeta.com.br" className="text-sm text-primary hover:text-white transition-colors font-sans">
        suporte@barbermeta.com.br
      </a>
    </div>
  )
}
