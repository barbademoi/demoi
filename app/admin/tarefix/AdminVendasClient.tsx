'use client'

import { useState, useTransition } from 'react'
import type { Venda } from '@/lib/tarefixModulo/vendas'
import { liberarVendaTarefix, listarVendasTarefix, recusarVendaTarefix } from './actions'

const quando = (v: string | null) =>
  v ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(v)) : '—'
const zap = (n: string) => (n.length <= 11 ? `55${n}` : n)

const ROTULO: Record<Venda['status'], [string, string]> = {
  pendente: ['Aguardando conferência', 'border-amber-400/30 bg-amber-400/10 text-amber-200'],
  liberada: ['Acesso liberado', 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'],
  recusada: ['Pagamento não localizado', 'border-red-400/30 bg-red-400/10 text-red-200'],
}

export default function AdminVendasClient({ inicial }: { inicial: Venda[] }) {
  const [vendas, setVendas] = useState(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [liberada, setLiberada] = useState<{ nome: string; mensagem: string; whatsapp: string } | null>(null)
  const [, start] = useTransition()

  const recarregar = async () => setVendas((await listarVendasTarefix()).vendas)

  function liberar(v: Venda) {
    if (!window.confirm(`O Pix de R$ 47 de ${v.nome} foi recebido e conferido?\n\nAo confirmar, a conta ${v.email} é criada com senha provisória.`)) return
    setErro(null)
    setOcupado(v.id)
    start(async () => {
      const r = await liberarVendaTarefix(v.id)
      setOcupado(null)
      if (!r.ok) return setErro(r.error)
      setLiberada({ nome: v.nome, mensagem: r.mensagem, whatsapp: r.whatsapp })
      await recarregar()
    })
  }

  function recusar(v: Venda) {
    const motivo = window.prompt('Por que o pagamento não foi localizado?')?.trim() ?? ''
    if (!motivo) return
    setOcupado(v.id)
    start(async () => {
      const r = await recusarVendaTarefix(v.id, motivo)
      setOcupado(null)
      if (r.error) return setErro(r.error)
      await recarregar()
    })
  }

  const pendentes = vendas.filter((v) => v.status === 'pendente').length
  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl text-text">Vendas pela página (Instagram)</h2>
      <p className="mt-1 text-sm text-text-muted">
        Página de vendas: <span className="font-semibold text-text">/tarefix/comprar</span> · {pendentes === 0 ? 'nenhum Pix aguardando' : `${pendentes} aguardando conferência`}
      </p>
      {erro && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{erro}</p>}

      {liberada && (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
          <p className="font-semibold text-emerald-100">✓ Acesso de {liberada.nome} criado. Mande agora (a senha não aparece de novo):</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-sm text-text">{liberada.mensagem}</pre>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a href={`https://wa.me/${zap(liberada.whatsapp)}?text=${encodeURIComponent(liberada.mensagem)}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-center">
              Enviar no WhatsApp
            </a>
            <button type="button" className="btn-ghost border border-border" onClick={() => navigator.clipboard.writeText(liberada.mensagem).catch(() => {})}>
              Copiar mensagem
            </button>
            <button type="button" className="btn-ghost" onClick={() => setLiberada(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {vendas.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-sm text-text-muted">Os pedidos aparecem aqui quando alguém tocar em “Já fiz o Pix” na página de vendas.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {vendas.map((v) => (
            <article key={v.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-text">{v.empresa}</h3>
                  <p className="text-sm text-text-muted">
                    {v.nome} · {v.email}
                  </p>
                  <a href={`https://wa.me/${zap(v.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline">
                    WhatsApp: {v.whatsapp}
                  </a>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ROTULO[v.status][1]}`}>{ROTULO[v.status][0]}</span>
              </div>
              <dl className="mt-4 grid gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Valor</dt><dd className="mt-1 font-semibold text-text">R$ 47,00</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Nome no Pix</dt><dd className="mt-1 font-semibold text-text">{v.payer_name || v.nome}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-text-muted">Avisou em</dt><dd className="mt-1 text-text">{quando(v.criado_em)}</dd></div>
              </dl>
              {v.motivo && <p className="mt-3 text-sm text-red-200">Motivo: {v.motivo}</p>}
              {v.status === 'pendente' && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={ocupado === v.id} onClick={() => liberar(v)} className="btn-primary">
                    {ocupado === v.id ? 'Liberando…' : 'Confirmar Pix e liberar'}
                  </button>
                  <button type="button" disabled={ocupado === v.id} onClick={() => recusar(v)} className="btn-ghost border border-red-400/30 text-red-200">
                    Não localizei o pagamento
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
