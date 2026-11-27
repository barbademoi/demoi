'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PLANOS, plano as acharPlano } from '@/lib/planos'
import { confirmarPagamento } from '../actions'

export default function FormConfirmar({
  memberId,
  paymentId,
  planoInicial,
  primeiraVez,
  inicioSugerido,
  hoje,
}: {
  memberId: string
  paymentId: string
  planoInicial: string
  primeiraVez: boolean
  inicioSugerido: string
  hoje: string
}) {
  const router = useRouter()
  const [plano, setPlano] = useState(planoInicial)
  const [valor, setValor] = useState(String(acharPlano(planoInicial)?.valor ?? ''))
  const [forma, setForma] = useState(acharPlano(planoInicial)?.forma ?? 'pix')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2"
      action={(fd) =>
        iniciar(async () => {
          const r = await confirmarPagamento(fd)
          setMsg({ ok: r.ok, t: r.ok ? r.msg ?? 'Confirmado!' : r.erro ?? 'Erro' })
          if (r.ok) router.refresh()
        })
      }
    >
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="payment_id" value={paymentId} />
      <label className="block">
        <span className="rotulo text-sm">Plano</span>
        <select
          name="plano"
          className="campo py-2.5"
          value={plano}
          onChange={(e) => {
            setPlano(e.target.value)
            const p = acharPlano(e.target.value)
            if (p) {
              setValor(String(p.valor))
              setForma(p.forma)
            }
          }}
        >
          {PLANOS.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="rotulo text-sm">Valor recebido (R$)</span>
        <input name="valor" className="campo py-2.5" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required />
      </label>
      <label className="block">
        <span className="rotulo text-sm">Forma</span>
        <select name="forma" className="campo py-2.5" value={forma} onChange={(e) => setForma(e.target.value as 'pix')}>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão (InfinitePay)</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <label className="block">
        <span className="rotulo text-sm">Data do pagamento</span>
        <input name="pago_em" type="date" className="campo py-2.5" defaultValue={hoje} required />
      </label>
      {primeiraVez && (
        <label className="block sm:col-span-2">
          <span className="rotulo text-sm">Data de início do membro (primeira vez)</span>
          <input name="data_inicio" type="date" className="campo py-2.5" defaultValue={inicioSugerido} required />
          <span className="ajuda block">A semana do membro conta a partir daqui. Fundador: 18/01/2027.</span>
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn-sm bg-ok px-5 text-fundo" disabled={pendente}>
          {pendente ? 'Confirmando...' : primeiraVez ? 'Confirmar e liberar acesso' : 'Confirmar e estender vencimento'}
        </button>
        {msg && <span className={msg.ok ? 'text-ok' : 'text-perigo'}>{msg.t}</span>}
      </div>
    </form>
  )
}
