import { redirect } from 'next/navigation'
import Marca from '@/components/Marca'
import { Passos } from '@/components/compra/WizardCompra'
import InfoPagamento from '@/components/compra/InfoPagamento'
import EnvioComprovante from '@/components/compra/EnvioComprovante'
import TrocarPlano from '@/components/compra/TrocarPlano'
import { buscarMembro, statusExibido } from '@/lib/membro'
import { lerConfig } from '@/lib/settings'
import { PAGAMENTO_PADRAO } from '@/lib/defaults'
import { plano as acharPlano, PLANOS } from '@/lib/planos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamento — MDC' }

export default async function Pagamento() {
  const { user, membro } = await buscarMembro()
  if (!user) redirect('/entrar?next=/comprar/pagamento')
  if (!membro) redirect('/comprar')
  const st = statusExibido(membro)
  if (st === 'aguardando') redirect('/aguardando')
  if (st === 'vencido' || st === 'cancelado') redirect('/renovar')
  if (st !== 'pendente') redirect('/app')

  const p = acharPlano(membro.plano) ?? PLANOS[0]
  const cfg = await lerConfig('pagamento', PAGAMENTO_PADRAO)

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <Marca href="/mdc" />
      <div className="pt-8">
        <Passos atual={3} />
        <h1 className="mb-1 text-3xl font-black">Pagamento</h1>
        <p className="mb-6 text-suave">Oi, {membro.nome.split(' ')[0]}! Falta só isso.</p>

        <TrocarPlano atual={p.id} />

        <section className="card mt-4 p-5">
          <InfoPagamento plano={p} cfg={cfg} />
        </section>

        <div className="mt-6">
          <EnvioComprovante userId={user.id} plano={p.id} />
        </div>
      </div>
    </main>
  )
}
