import Link from 'next/link'
import Marca from '@/components/Marca'
import FormEntrar from './FormEntrar'

export const metadata = { title: 'Entrar — MDC' }

export default function Entrar({ searchParams }: { searchParams: { next?: string; erro?: string; ok?: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
      <Marca />
      <div className="flex flex-1 flex-col justify-center py-10">
        <h1 className="mb-2 text-3xl font-black">Entrar</h1>
        <p className="mb-8 text-suave">Use o e-mail e a senha que você cadastrou.</p>
        {searchParams.erro === 'sem-acesso' && (
          <p className="mb-6 rounded-xl bg-perigo/10 p-4 text-perigo">Essa conta não tem acesso a essa área.</p>
        )}
        {searchParams.ok === 'senha' && (
          <p className="mb-6 rounded-xl bg-ok/10 p-4 text-ok">Senha trocada. Agora é só entrar.</p>
        )}
        <FormEntrar next={searchParams.next ?? ''} />
        <Link href="/esqueci-senha" className="mt-6 text-center text-base text-latao underline-offset-4 hover:underline">
          Esqueci minha senha
        </Link>
      </div>
    </main>
  )
}
