import { Logo } from '@/components/tarefix/Logo'
import { BotaoSair } from '@/components/tarefix/BotaoSair'

export const metadata = { title: 'Sem acesso' }

export default function SemAcesso() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo className="text-5xl" />
      <h1 className="text-xl font-extrabold">Esta conta não tem acesso ao Tarefix</h1>
      <p className="text-tf-suave">Você entrou com uma conta que não é dona de nenhuma empresa no Tarefix. Saia e entre com a conta certa.</p>
      <BotaoSair className="tf-botao w-full" />
    </main>
  )
}
