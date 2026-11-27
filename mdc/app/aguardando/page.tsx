import Link from 'next/link'
import { redirect } from 'next/navigation'
import Marca from '@/components/Marca'
import { buscarMembro, statusExibido } from '@/lib/membro'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aguardando confirmação — MDC' }

export default async function Aguardando() {
  const { user, membro } = await buscarMembro()
  if (!user) redirect('/entrar?next=/aguardando')
  if (!membro) redirect('/comprar')
  const st = statusExibido(membro)
  if (st === 'pendente') redirect('/comprar/pagamento')
  if (st === 'ativo' || st === 'vence_em_breve') redirect('/app')
  if (st === 'vencido' || st === 'cancelado') redirect('/renovar')

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-12 pt-6">
      <Marca />
      <div className="flex flex-1 flex-col justify-center py-12 text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-latao/15 text-4xl" aria-hidden>⏳</div>
        <h1 className="text-4xl font-black leading-tight">Recebemos!</h1>
        <p className="mt-5 text-lg text-suave">Assim que o pagamento for confirmado, seu acesso é liberado.</p>
        <p className="mt-3 text-base text-suave">Pode fechar essa tela. Quando liberar, é só entrar de novo com seu e-mail e senha.</p>
        <Link href="/aguardando" className="btn-secundario mt-10 w-full sm:w-full">Atualizar</Link>
        <form action="/sair" method="post" className="mt-3">
          <button className="text-sm text-suave underline">Sair</button>
        </form>
      </div>
    </main>
  )
}
