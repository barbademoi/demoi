'use client'

import { useMemo, useState, useTransition } from 'react'
import { ajustarAssinatura, type AcaoAssinatura, type LinhaAssinante } from './actions'
import type { EstadoAcesso } from '@/lib/assinatura/acesso'

const ESTADOS: Array<{ id: EstadoAcesso; label: string; classe: string }> = [
  { id: 'ok',         label: 'Em dia',     classe: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' },
  { id: 'avisar',     label: 'Vencendo',   classe: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  { id: 'carencia',   label: 'Carência',   classe: 'border-orange-400/30 bg-orange-400/10 text-orange-200' },
  { id: 'bloqueado',  label: 'Bloqueado',  classe: 'border-red-400/30 bg-red-400/10 text-red-200' },
  { id: 'revisar',    label: 'Revisar',    classe: 'border-sky-400/30 bg-sky-400/10 text-sky-200' },
]

const meta = (e: EstadoAcesso) => ESTADOS.find(x => x.id === e)
  ?? { id: e, label: e, classe: 'border-border text-text-muted' }

function data(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' })
    .format(new Date(iso))
}

export default function AssinaturasClient({ rows }: { rows: LinhaAssinante[] }) {
  const [filtro, setFiltro] = useState<EstadoAcesso | 'todos'>('todos')
  const [periodo, setPeriodo] = useState<'todas' | 'mensal' | 'anual'>('todas')
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, startTransition] = useTransition()

  const contagem = useMemo(() => {
    const base = {} as Record<EstadoAcesso, number>
    for (const e of ESTADOS) base[e.id] = 0
    for (const r of rows) base[r.estado] = (base[r.estado] ?? 0) + 1
    return base
  }, [rows])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return rows.filter(r => {
      if (filtro !== 'todos' && r.estado !== filtro) return false
      if (periodo !== 'todas' && r.periodicidade !== periodo) return false
      if (termo && !r.email.toLowerCase().includes(termo) && !r.barbearia.toLowerCase().includes(termo)) return false
      return true
    })
  }, [rows, filtro, periodo, busca])

  function agir(id: string, acao: AcaoAssinatura, rotulo: string, nome: string) {
    // Virar vitalício é irreversível na prática (a conta some da régua de
    // validade), então pede confirmação; o resto é ajuste de data.
    if (acao === 'vitalicio' && !confirm(`Tornar ${nome} VITALÍCIO? A conta deixa de ser cobrada e nunca mais é checada por validade.`)) return
    if (acao === 'bloquear' && !confirm(`Bloquear ${nome} agora?`)) return
    setErro(null)
    startTransition(async () => {
      const r = await ajustarAssinatura(id, acao)
      if (r.error) setErro(`${rotulo} falhou: ${r.error}`)
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ESTADOS.map(e => {
          const ativo = filtro === e.id
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setFiltro(ativo ? 'todos' : e.id)}
              className={`rounded-2xl border p-4 text-left transition ${e.classe} ${ativo ? 'ring-2 ring-primary/70' : 'hover:brightness-110'}`}
            >
              <p className="font-serif text-3xl tabular-nums">{contagem[e.id] ?? 0}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em]">{e.label}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por e-mail ou barbearia…"
          className="input min-w-0 flex-1 text-[16px]"
          style={{ fontSize: '16px' }}
        />
        {(['todas', 'mensal', 'anual'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              p === periodo ? 'border-primary/60 bg-primary/10 text-text' : 'border-border text-text-muted hover:text-text'
            }`}
          >
            {p === 'todas' ? 'Todas' : p === 'mensal' ? 'Mensais' : 'Anuais'}
          </button>
        ))}
      </div>

      {erro && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-3 text-sm text-red-200">{erro}</div>
      )}

      <div className="card divide-y divide-border overflow-hidden">
        {visiveis.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">
            {rows.length === 0
              ? 'Nenhum assinante ainda. Os ~600 clientes vitalícios não aparecem aqui de propósito — eles não têm validade a tratar.'
              : 'Nenhum assinante neste filtro.'}
          </p>
        ) : (
          visiveis.map(r => {
            const m = meta(r.estado)
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[14rem] flex-1">
                  <p className="truncate font-sans font-semibold text-text">{r.barbearia}</p>
                  <p className="truncate text-xs text-text-muted">{r.email}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {r.periodicidade ?? 'periodicidade indefinida'}
                    {' · vale até '}{data(r.validoAte)}
                    {r.diasParaVencer !== null && r.diasParaVencer < 0 && ` (venceu há ${-r.diasParaVencer} d)`}
                    {r.status && ` · ${r.status}`}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${m.classe}`}>
                  {m.label}
                </span>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" disabled={pendente}
                    onClick={() => agir(r.id, 'estender', 'Estender', r.barbearia)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-text hover:bg-white/5 disabled:opacity-50">
                    +30 dias
                  </button>
                  <button type="button" disabled={pendente}
                    onClick={() => agir(r.id, 'liberar', 'Liberar', r.barbearia)}
                    className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50">
                    Liberar
                  </button>
                  <button type="button" disabled={pendente}
                    onClick={() => agir(r.id, 'bloquear', 'Bloquear', r.barbearia)}
                    className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-400/10 disabled:opacity-50">
                    Bloquear
                  </button>
                  <button type="button" disabled={pendente}
                    onClick={() => agir(r.id, 'vitalicio', 'Vitalício', r.barbearia)}
                    className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text hover:bg-primary/20 disabled:opacity-50">
                    Vitalício
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        <span className="text-text">+30 dias</span> estende a partir da validade atual quando ela está no futuro,
        e de hoje quando já venceu — mesma regra da renovação automática.
        {' '}<span className="text-text">Liberar</span> destrava quem pagou mas cujo evento não chegou, dando 7 dias
        até o webhook se acertar. <span className="text-text">Vitalício</span> tira a conta da régua de validade
        para sempre. Clientes vitalícios não aparecem nesta lista: eles não têm assinatura a tratar.
      </p>
    </div>
  )
}
