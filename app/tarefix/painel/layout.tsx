import { exigirDono } from '@/lib/tarefix/dono'
import { Nav, Sininho } from '@/components/tarefix/Nav'
import { contarAvisosNaoLidos, garantirResumoDiario } from '@/lib/tarefix/painelHoje'
import { Logo } from '@/components/tarefix/Logo'
import { BotaoAtualizar } from '@/components/tarefix/BotaoAtualizar'

export const dynamic = 'force-dynamic'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { empresa } = await exigirDono()
  // Resumo do fechamento (sem cron): gravado na primeira abertura do painel depois do horário.
  await garantirResumoDiario(empresa)
  const naoLidos = await contarAvisosNaoLidos(empresa.id)
  return (
    <div className="min-h-dvh lg:pl-60">
      <header className="flex items-center justify-between px-4 pt-5 lg:hidden">
        <Logo className="text-2xl" />
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-tf-suave">{empresa.nome}</span>
          <BotaoAtualizar intervaloSeg={60} />
          <Sininho naoLidos={naoLidos} />
        </div>
      </header>
      <Nav nomeEmpresa={empresa.nome} naoLidos={naoLidos} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-10">{children}</main>
    </div>
  )
}
