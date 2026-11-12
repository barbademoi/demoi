import { Logo } from '@/components/Logo'

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-6xl" />
      <p className="text-lg text-suave">Checklist diário da equipe.</p>
      <p className="text-sm text-suave">Etapa 1 · banco pronto. Veja <a className="font-bold text-marca underline" href="/status">/status</a>.</p>
    </main>
  )
}
