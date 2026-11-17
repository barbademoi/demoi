import { Logo } from '@/components/tarefix/Logo'
import { BotaoSair } from '@/components/tarefix/BotaoSair'
import { FormCriarMeuTarefix } from '../criar-conta/FormCriarConta'

export const metadata = { title: 'Sem acesso' }

export default function SemAcesso({ searchParams }: { searchParams: { motivo?: string } }) {
  const suspenso = searchParams.motivo === 'suspenso'
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo className="text-5xl" />
      <h1 className="text-xl font-extrabold">{suspenso ? 'Seu acesso está suspenso' : 'Falta pouco: crie o seu Tarefix'}</h1>
      <p className="text-tf-suave">
        {suspenso
          ? 'Os seus dados continuam guardados. Fale com quem liberou o seu acesso para reativar.'
          : 'A sua conta ainda não tem um Tarefix. Crie agora, em um toque, ou saia e entre com outra conta.'}
      </p>
      {!suspenso && <FormCriarMeuTarefix />}
      <BotaoSair className={suspenso ? 'tf-botao w-full' : 'tf-botao2 w-full'} />
    </main>
  )
}
