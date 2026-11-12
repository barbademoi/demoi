import { Logo } from '@/components/tarefix/Logo'

export default function TarefixInicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-6xl" />
      <p className="text-lg text-tf-suave">Checklist diário da equipe.</p>
      <a className="tf-botao" href="/tarefix/instalar">Instalação</a>
    </main>
  )
}
