'use client'

import { useMemo, useState } from 'react'
import type { NivelUso, UsoBarbearia } from './actions'

const NIVEIS: Array<{ id: NivelUso; label: string; hint: string; classe: string }> = [
  { id: 'diaria',     label: 'Diária',     hint: '20+ dias ativos e parada há no máximo 2 dias', classe: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' },
  { id: 'frequente',  label: 'Frequente',  hint: '10 a 19 dias ativos nos últimos 30',           classe: 'border-sky-400/30 bg-sky-400/10 text-sky-200' },
  { id: 'esporadica', label: 'Esporádica', hint: '1 a 9 dias ativos nos últimos 30',             classe: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  { id: 'inativa',    label: 'Inativa',    hint: 'Nenhum dia com atividade nos últimos 30',      classe: 'border-red-400/30 bg-red-400/10 text-red-200' },
]

const estiloDe = (uso: NivelUso) => NIVEIS.find((n) => n.id === uso)?.classe ?? ''
const rotuloDe = (uso: NivelUso) => NIVEIS.find((n) => n.id === uso)?.label ?? uso

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' })
    .format(new Date(value + 'T12:00:00'))
}

export default function UsoClient({ rows, dias }: { rows: UsoBarbearia[]; dias: number }) {
  const [filtro, setFiltro] = useState<NivelUso | 'todas'>('todas')
  const [busca, setBusca] = useState('')

  const contagem = useMemo(() => {
    const base: Record<NivelUso, number> = { diaria: 0, frequente: 0, esporadica: 0, inativa: 0 }
    for (const r of rows) base[r.uso] += 1
    return base
  }, [rows])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return rows.filter((r) => {
      if (filtro !== 'todas' && r.uso !== filtro) return false
      if (termo && !r.nome.toLowerCase().includes(termo)) return false
      return true
    })
  }, [rows, filtro, busca])

  // "Inativa" com lançamento mensal recente não é abandono — é outro ritmo de
  // uso, e misturar os dois faria a régua de retenção mentir.
  const mensaisEntreInativas = rows.filter((r) => r.uso === 'inativa' && r.usaMensal).length

  return (
    <div className="space-y-5">
      {/* Resumo por nível — cada card também é o filtro. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NIVEIS.map((n) => {
          const ativo = filtro === n.id
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setFiltro(ativo ? 'todas' : n.id)}
              title={n.hint}
              className={`rounded-2xl border p-4 text-left transition ${n.classe} ${ativo ? 'ring-2 ring-primary/70' : 'hover:brightness-110'}`}
            >
              <p className="font-serif text-3xl tabular-nums">{contagem[n.id]}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em]">{n.label}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar barbearia…"
          className="input min-w-0 flex-1 text-[16px]"
          style={{ fontSize: '16px' }}
        />
        {filtro !== 'todas' && (
          <button type="button" onClick={() => setFiltro('todas')} className="text-xs text-text-muted underline hover:text-text">
            Limpar filtro ({rotuloDe(filtro)})
          </button>
        )}
      </div>

      {mensaisEntreInativas > 0 && (
        <p className="rounded-xl border border-border bg-surface-2 p-3 text-xs leading-relaxed text-text-muted">
          {mensaisEntreInativas} barbearia{mensaisEntreInativas === 1 ? '' : 's'} marcada{mensaisEntreInativas === 1 ? '' : 's'} como
          inativa lançou o acumulado do mês nos últimos {dias} dias — aparece com a etiqueta{' '}
          <span className="font-semibold text-text">mensal</span>. Usa o sistema em outro ritmo, não abandonou.
        </p>
      )}

      <div className="card divide-y divide-border overflow-hidden">
        {visiveis.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">Nenhuma barbearia neste filtro.</p>
        ) : (
          visiveis.map((r) => (
            <div key={r.barbeariaId} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-sans font-semibold text-text">
                  {r.nome}
                  {r.usaMensal && (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      mensal
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {r.barbeiros} {r.barbeiros === 1 ? 'barbeiro' : 'barbeiros'}
                  {' · '}último uso {formatDate(r.ultimoUso)}
                  {r.diasParado !== null && r.diasParado > 0 && ` · parada há ${r.diasParado} ${r.diasParado === 1 ? 'dia' : 'dias'}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-right text-xs text-text-muted">
                  <span className="block font-serif text-xl tabular-nums text-text">{r.diasAtivos}</span>
                  de {dias} dias
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${estiloDe(r.uso)}`}>
                  {rotuloDe(r.uso)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        Conta como atividade do dia: o dono lançar o dia (ou a extensão do Agenda Serviço), o barbeiro
        lançar pontos da campanha pelo link dele, ou marcar “não pontuei hoje”.
      </p>
    </div>
  )
}
