import { Logo } from '@/components/tarefix/Logo'
import { BotaoSair } from '@/components/tarefix/BotaoSair'
import { createTarefixServer } from '@/lib/tarefix/supabase/server'
import { ehClienteBarbermeta } from '@/lib/tarefixModulo/clienteBarbermeta'

export const metadata = { title: 'Sem acesso' }
export const dynamic = 'force-dynamic'

export default async function SemAcesso({ searchParams }: { searchParams: { motivo?: string } }) {
  const suspenso = searchParams.motivo === 'suspenso'
  const { data: { user } } = await createTarefixServer().auth.getUser()
  // cliente do BarberMeta compra o Tarefix lá dentro (módulo pago)
  const cliente = !suspenso && user ? await ehClienteBarbermeta(user.id) : false
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo className="text-5xl" />
      <h1 className="text-xl font-extrabold">{suspenso ? 'Seu acesso está suspenso' : cliente ? 'Libere o Tarefix no BarberMeta' : 'Sua conta ainda não tem o Tarefix'}</h1>
      <p className="text-tf-suave">
        {suspenso
          ? 'Os seus dados continuam guardados. Fale com quem liberou o seu acesso para reativar.'
          : cliente
            ? 'Para clientes do BarberMeta, o Tarefix é um módulo extra: pagamento único de R$ 47,00. Libere pelo menu Tarefix do BarberMeta e entre com o mesmo login.'
            : 'Conheça o Tarefix e garanta o seu por R$ 47 (pagamento único), ou saia e entre com outra conta.'}
      </p>
      {cliente && (
        <a href="/dashboard/tarefix" className="tf-botao w-full">
          Liberar o Tarefix no BarberMeta
        </a>
      )}
      {!suspenso && !cliente && (
        <a href="/tarefix/comprar" className="tf-botao w-full">
          Conhecer o Tarefix
        </a>
      )}
      <BotaoSair className={suspenso ? 'tf-botao w-full' : 'tf-botao2 w-full'} />
    </main>
  )
}
