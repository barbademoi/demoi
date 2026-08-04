'use client'

import { useState, useTransition } from 'react'
import {
  listarPedidosBrindoleta,
  revisarPedidoBrindoleta,
  type BrindoletaOrder,
} from './actions'

const statusLabels: Record<BrindoletaOrder['status'], string> = {
  pending: 'Aguardando confirmação',
  active: 'Acesso liberado',
  rejected: 'Pagamento não localizado',
  suspended: 'Acesso suspenso',
}
const statusStyles: Record<BrindoletaOrder['status'], string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  rejected: 'border-red-400/30 bg-red-400/10 text-red-200',
  suspended: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-200',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default function AdminBrindoletaClient({ initialOrders }: { initialOrders: BrindoletaOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function review(order: BrindoletaOrder, status: 'active' | 'rejected' | 'suspended') {
    let reason = ''
    if (status === 'rejected') {
      reason = window.prompt('Por que o pagamento não foi localizado?')?.trim() ?? ''
      if (!reason) return
    }
    if (status === 'suspended' && !window.confirm(`Suspender o acesso de ${order.barbeariaNome}?`)) return
    if (status === 'active' && !window.confirm(`O Pix de ${formatMoney(order.amountCents)} foi recebido e conferido?`)) return

    const formData = new FormData()
    formData.set('barbearia_id', order.barbeariaId)
    formData.set('status', status)
    formData.set('reason', reason)
    setError(null)
    setBusyId(order.barbeariaId)

    startTransition(async () => {
      const result = await revisarPedidoBrindoleta(formData)
      if (result.error) {
        setError(result.error)
        setBusyId(null)
        return
      }
      const refreshed = await listarPedidosBrindoleta()
      setOrders(refreshed.orders)
      setBusyId(null)
    })
  }

  const pendingCount = orders.filter((order) => order.status === 'pending').length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {pendingCount === 0 ? 'Nenhum pagamento aguardando.' : `${pendingCount} pagamento${pendingCount > 1 ? 's' : ''} aguardando conferência.`}
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const refreshed = await listarPedidosBrindoleta()
            setOrders(refreshed.orders)
          })}
          className="btn-ghost border border-border text-sm"
        >
          Atualizar lista
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-text-muted">Os pedidos aparecerão aqui quando um cliente tocar em “Já fiz o pagamento”.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.barbeariaId} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-sans text-lg font-semibold text-text">{order.barbeariaNome}</h2>
                  <p className="mt-0.5 text-sm text-text-muted">{order.ownerEmail}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Valor</dt><dd className="mt-1 font-semibold text-text">{formatMoney(order.amountCents)}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Nome no Pix</dt><dd className="mt-1 font-semibold text-text">{order.payerName}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Avisou em</dt><dd className="mt-1 text-text">{formatDate(order.requestedAt)}</dd></div>
              </dl>
              {order.paymentNote && <p className="mt-3 text-sm text-text-muted">Observação: <span className="text-text">{order.paymentNote}</span></p>}
              {order.rejectionReason && <p className="mt-3 text-sm text-red-200">Motivo: {order.rejectionReason}</p>}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {order.status !== 'active' && (
                  <button
                    type="button"
                    disabled={isPending && busyId === order.barbeariaId}
                    onClick={() => review(order, 'active')}
                    className="btn-primary"
                  >
                    {busyId === order.barbeariaId ? 'Salvando…' : 'Confirmar Pix e liberar'}
                  </button>
                )}
                {order.status === 'pending' && (
                  <button type="button" onClick={() => review(order, 'rejected')} className="btn-ghost border border-red-400/30 text-red-200">
                    Não localizei o pagamento
                  </button>
                )}
                {order.status === 'active' && (
                  <button type="button" onClick={() => review(order, 'suspended')} className="btn-ghost border border-border">
                    Suspender acesso
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
