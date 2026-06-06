'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react'

export interface Compra {
  id: string
  transaction_id: string
  email_comprador: string
  nome_comprador: string | null
  status: 'pending' | 'approved' | 'refunded' | 'failed' | 'canceled'
  valor_pago: number | null
  created_at: string
  usuario_id: string | null
  estabelecimento_id: string | null
  senha_temporaria: string | null
}

export interface WebhookRaw {
  id: string
  event: string | null
  erro_processamento: string | null
  tentativas: number
  recebido_em: string
  ultima_tentativa_em: string | null
  payload: Record<string, unknown>
}

interface Props {
  compras: Compra[]
  webhooksFalhos: WebhookRaw[]
  totalAprovadas: number
}

function dataLonga(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CLASSES: Record<string, string> = {
  approved: 'bg-verde-musgo/15 text-verde-musgo',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-red-100 text-red-700',
  canceled: 'bg-chumbo/20 text-chumbo',
  failed: 'bg-red-100 text-red-700',
}

export function ComprasAdminClient({ compras, webhooksFalhos, totalAprovadas }: Props) {
  const router = useRouter()
  const [emailTeste, setEmailTeste] = useState('')
  const [pendingTest, startTest] = useTransition()
  const [resultadoTeste, setResultadoTeste] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [reprocessando, setReprocessando] = useState<string | null>(null)

  const dispararTeste = () => {
    if (!emailTeste.includes('@')) return
    setResultadoTeste(null)
    startTest(async () => {
      const res = await fetch('/api/admin/testar-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTeste.toLowerCase().trim() }),
      })
      const json = await res.json()
      setResultadoTeste(JSON.stringify(json, null, 2))
      router.refresh()
    })
  }

  const reprocessar = async (id: string) => {
    setReprocessando(id)
    try {
      const res = await fetch(`/api/admin/reprocessar-webhook/${id}`, { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setReprocessando(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Resumo */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CardStat label="Aprovadas" valor={totalAprovadas} icone={<CheckCircle2 size={18} className="text-verde-musgo" />} />
        <CardStat label="Últimas 50 (lista abaixo)" valor={compras.length} icone={<Activity size={18} className="text-marrom" />} />
        <CardStat
          label="Webhooks falhos"
          valor={webhooksFalhos.length}
          icone={<AlertTriangle size={18} className="text-red-700" />}
          alerta={webhooksFalhos.length > 0}
        />
      </section>

      {/* Testar webhook */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <Play size={16} className="text-marrom" /> Testar webhook
        </h2>
        <p className="text-sm text-grafite">
          Dispara um PURCHASE_APPROVED fake usando o email abaixo. Útil pra validar
          que tudo está funcionando após mudanças.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={emailTeste}
            onChange={(e) => setEmailTeste(e.target.value)}
            placeholder="seu-email+teste@gmail.com"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={dispararTeste}
            disabled={pendingTest || !emailTeste.includes('@')}
            className="btn-primary"
          >
            {pendingTest ? 'Disparando...' : 'Disparar teste'}
          </button>
        </div>
        {resultadoTeste && (
          <pre className="text-xs bg-linho/50 border border-border rounded p-3 overflow-x-auto">
            {resultadoTeste}
          </pre>
        )}
      </section>

      {/* Webhooks falhos */}
      <section className="space-y-3">
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-700" />
          Webhooks que falharam
          <span className="text-xs font-normal text-chumbo">({webhooksFalhos.length})</span>
        </h2>
        {webhooksFalhos.length === 0 ? (
          <p className="text-sm text-chumbo bg-verde-musgo/10 border-l-4 border-verde-musgo p-3 rounded">
            Nada pendente. Tudo processou OK.
          </p>
        ) : (
          <div className="space-y-2">
            {webhooksFalhos.map((w) => (
              <article key={w.id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-linho text-text">
                        {w.event ?? 'sem_evento'}
                      </span>
                      <span className="text-xs text-chumbo">
                        recebido {dataLonga(w.recebido_em)}
                      </span>
                      <span className="text-xs text-chumbo">·</span>
                      <span className="text-xs text-chumbo">{w.tentativas} tentativa(s)</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1 font-mono">
                      {w.erro_processamento ?? 'erro desconhecido'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => reprocessar(w.id)}
                    disabled={reprocessando === w.id}
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-marrom border border-marrom/30 px-2.5 py-1.5 rounded hover:bg-linho disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={reprocessando === w.id ? 'animate-spin' : ''} />
                    Reprocessar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandido(expandido === w.id ? null : w.id)}
                  className="text-xs text-chumbo inline-flex items-center gap-1 hover:text-text"
                >
                  {expandido === w.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Ver payload
                </button>
                {expandido === w.id && (
                  <pre className="text-xs bg-linho/50 border border-border rounded p-3 overflow-x-auto max-h-60 overflow-y-auto">
                    {JSON.stringify(w.payload, null, 2)}
                  </pre>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Últimas compras */}
      <section className="space-y-3">
        <h2 className="font-semibold text-text">Últimas compras (50)</h2>
        {compras.length === 0 ? (
          <p className="text-sm text-chumbo bg-linho/40 p-3 rounded">Nenhuma compra ainda.</p>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-linho/40 text-chumbo text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Quando</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-linho/20">
                      <td className="px-3 py-2 text-chumbo whitespace-nowrap">{dataLonga(c.created_at)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{c.email_comprador}</td>
                      <td className="px-3 py-2">{c.nome_comprador ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                            STATUS_CLASSES[c.status] ?? 'bg-chumbo/20 text-chumbo'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {c.valor_pago !== null ? `R$ ${Number(c.valor_pago).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function CardStat({
  label,
  valor,
  icone,
  alerta,
}: {
  label: string
  valor: number
  icone: React.ReactNode
  alerta?: boolean
}) {
  return (
    <div className={['card p-4', alerta ? 'border-red-300 bg-red-50/30' : ''].join(' ')}>
      <div className="flex items-center gap-2">
        {icone}
        <span className="text-xs text-chumbo uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-serif text-preto mt-1.5">{valor}</p>
    </div>
  )
}
