import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verificarAssinatura } from '@/lib/assinatura/verificar'

export const metadata = { title: 'Assinatura — BarberMeta' }
export const dynamic = 'force-dynamic'

// Área de compras da Hotmart: é onde o cliente atualiza o cartão e reativa.
const HOTMART_COMPRAS = 'https://consumer.hotmart.com/purchase'

/**
 * TELA DE ASSINATURA VENCIDA.
 *
 * Fica FORA de /dashboard de propósito: se estivesse dentro, a trava do layout
 * redirecionaria pra cá em loop.
 *
 * Não apaga nada e não esconde nada de forma definitiva — o dado do cliente
 * continua no lugar, esperando ele regularizar.
 */
export default async function AssinaturaPage() {
  const a = await verificarAssinatura()
  // Quem está em dia (ou é vitalício) não tem o que fazer aqui.
  if (a.liberado) redirect('/dashboard')

  const venceu = a.validoAte
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(a.validoAte)
    : null

  return (
    <main className="bm-theme flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Assinatura vencida</p>
        <h1 className="mt-3 font-serif text-3xl text-text">Regularize para voltar a usar</h1>

        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          {a.cancelada
            ? 'Sua assinatura foi cancelada'
            : a.atrasada
              ? 'O pagamento da sua assinatura não foi identificado'
              : 'Sua assinatura venceu'}
          {venceu ? ` e o acesso valia até ${venceu}.` : '.'}{' '}
          Assim que o pagamento for confirmado, o acesso volta sozinho.
        </p>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-sm leading-relaxed text-text">
            <span className="font-semibold">Seus dados continuam aqui.</span> Nada foi apagado —
            barbeiros, metas, lançamentos e histórico seguem intactos, esperando você voltar.
          </p>
        </div>

        <a
          href={HOTMART_COMPRAS}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 flex w-full items-center justify-center py-3.5"
        >
          Regularizar na Hotmart ↗
        </a>

        <p className="mt-4 text-center text-xs leading-relaxed text-text-muted">
          Já pagou e continua vendo esta tela? A confirmação pode levar alguns minutos.
          Recarregue a página ou fale com o suporte.
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-text-muted">
          <Link href="/dashboard" className="underline hover:text-text">Tentar de novo</Link>
          <Link href="/login" className="underline hover:text-text">Sair</Link>
        </div>
      </div>
    </main>
  )
}
