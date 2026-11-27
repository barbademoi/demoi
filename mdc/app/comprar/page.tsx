import { redirect } from 'next/navigation'
import Marca from '@/components/Marca'
import WizardCompra from '@/components/compra/WizardCompra'
import { buscarMembro, statusExibido } from '@/lib/membro'
import { planoValido } from '@/lib/planos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Entrar no MDC' }

export default async function Comprar({ searchParams }: { searchParams: { plano?: string } }) {
  try {
    const { membro } = await buscarMembro()
    if (membro) {
      const st = statusExibido(membro)
      if (st === 'pendente') redirect('/comprar/pagamento')
      if (st === 'aguardando') redirect('/aguardando')
      if (st === 'vencido' || st === 'cancelado') redirect('/renovar')
      redirect('/app')
    }
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
  }

  const inicial = planoValido(searchParams.plano) ? searchParams.plano : ''
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <Marca href="/mdc" />
      <WizardCompra planoInicial={inicial} />
    </main>
  )
}
