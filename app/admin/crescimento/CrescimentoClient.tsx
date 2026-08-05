'use client'

import { useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import type { CrescimentoBarbearia, Tendencia } from './actions'

// Cores de STATUS (estado, não identidade de série): cada uma sempre acompanhada
// do rótulo em texto, nunca só a cor.
const TENDENCIAS: Array<{ id: Tendencia; label: string; hint: string; classe: string; cor: string }> = [
  { id: 'subindo',  label: 'Subindo',  hint: 'Cresceu 5% ou mais sobre o ciclo anterior', classe: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200', cor: '#34d399' },
  { id: 'estavel',  label: 'Estável',  hint: 'Variação entre -5% e +5%',                  classe: 'border-sky-400/30 bg-sky-400/10 text-sky-200',             cor: '#38bdf8' },
  { id: 'caindo',   label: 'Caindo',   hint: 'Caiu 5% ou mais sobre o ciclo anterior',    classe: 'border-red-400/30 bg-red-400/10 text-red-200',             cor: '#f87171' },
  { id: 'sem_base', label: 'Sem base', hint: 'Ciclo anterior zerado — nada a comparar',   classe: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-300',          cor: '#a1a1aa' },
]

const meta = (t: Tendencia) => TENDENCIAS.find((x) => x.id === t) ?? TENDENCIAS[3]

function money(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(v)
}

function pct(v: number | null) {
  if (v === null) return '—'
  const s = v > 0 ? '+' : ''
  return `${s}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function mesAno(mes: number | null, ano: number | null) {
  if (!mes || !ano) return '—'
  return `${MESES[mes - 1]}/${String(ano).slice(2)}`
}

function dataCurta(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .format(new Date(iso + 'T12:00:00'))
}

export default function CrescimentoClient({
  rows,
  ciclos,
}: {
  rows: CrescimentoBarbearia[]
  ciclos: number
}) {
  const [filtro, setFiltro] = useState<Tendencia | 'todas'>('todas')
  const [busca, setBusca] = useState('')

  const contagem = useMemo(() => {
    const base: Record<Tendencia, number> = { subindo: 0, estavel: 0, caindo: 0, sem_base: 0 }
    for (const r of rows) base[r.tendencia] += 1
    return base
  }, [rows])

  // Totais só do último ciclo FECHADO — somar o ciclo em andamento junto
  // misturaria período completo com período pela metade.
  const totalFechado = useMemo(() => rows.reduce((s, r) => s + r.ultimoFechado, 0), [rows])
  const totalAnterior = useMemo(() => rows.reduce((s, r) => s + r.anteriorFechado, 0), [rows])
  const crescimentoRede = totalAnterior > 0
    ? ((totalFechado - totalAnterior) / totalAnterior) * 100
    : null

  // Mediana, não média: uma barbearia que saiu de R$ 500 pra R$ 5.000 marca
  // +900% e sozinha puxaria a média da rede pra um número que não descreve
  // ninguém. Só entram as que têm base de comparação.
  const comBaseLista = useMemo(
    () => rows.map((r) => r.crescimentoTotal).filter((v): v is number => v !== null).sort((a, b) => a - b),
    [rows],
  )
  const comBase = comBaseLista.length
  const medianaDesdeInicio = comBase === 0
    ? null
    : comBase % 2 === 1
      ? comBaseLista[(comBase - 1) / 2]
      : Math.round(((comBaseLista[comBase / 2 - 1] + comBaseLista[comBase / 2]) / 2) * 10) / 10

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return rows.filter((r) => {
      if (filtro !== 'todas' && r.tendencia !== filtro) return false
      if (termo && !r.nome.toLowerCase().includes(termo)) return false
      return true
    })
  }, [rows, filtro, busca])

  return (
    <div className="space-y-5">
      {/* Números da rede — um por vez, sem gráfico: são valores únicos. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Faturamento no último ciclo fechado</p>
          <p className="mt-1 font-serif text-3xl text-text">{money(totalFechado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Contra o ciclo anterior</p>
          <p className={`mt-1 font-serif text-3xl ${
            crescimentoRede === null ? 'text-text-muted'
              : crescimentoRede >= 0 ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {pct(crescimentoRede === null ? null : Math.round(crescimentoRede * 10) / 10)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">de {money(totalAnterior)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Crescimento típico desde o início</p>
          <p className={`mt-1 font-serif text-3xl ${
            medianaDesdeInicio === null ? 'text-text-muted'
              : medianaDesdeInicio >= 0 ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {pct(medianaDesdeInicio)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            mediana de {comBase} de {rows.length} barbearias
          </p>
        </div>
      </div>

      {/* Cada card de tendência também filtra a lista. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TENDENCIAS.map((t) => {
          const ativo = filtro === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltro(ativo ? 'todas' : t.id)}
              title={t.hint}
              className={`rounded-2xl border p-4 text-left transition ${t.classe} ${ativo ? 'ring-2 ring-primary/70' : 'hover:brightness-110'}`}
            >
              <p className="font-serif text-3xl tabular-nums">{contagem[t.id]}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em]">{t.label}</p>
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
            Limpar filtro ({meta(filtro).label})
          </button>
        )}
      </div>

      <div className="card divide-y divide-border overflow-hidden">
        {visiveis.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">Nenhuma barbearia neste filtro.</p>
        ) : (
          visiveis.map((r) => {
            const t = meta(r.tendencia)
            return (
              <div key={r.barbeariaId} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[13rem] flex-1">
                  <p className="truncate font-sans font-semibold text-text">{r.nome}</p>

                  {/* A jornada: quanto faturava no primeiro mês → quanto fatura hoje. */}
                  {r.mesesComDados > 0 ? (
                    <p className="mt-1 text-sm text-text">
                      <span className="text-text-muted">{money(r.primeiroValor)}</span>
                      <span className="text-text-muted"> em {mesAno(r.primeiroMes, r.primeiroAno)} → </span>
                      <span className="font-semibold">{money(r.ultimoValor)}</span>
                      <span className="text-text-muted"> em {mesAno(r.ultimoMes, r.ultimoAno)}</span>
                      {r.ultimoEmAndamento && (
                        <span className="ml-1.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                          mês em curso
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-text-muted">Ainda não lançou faturamento</p>
                  )}

                  <p className="mt-0.5 text-xs text-text-muted">
                    Entrou em {dataCurta(r.entrouEm)}
                    {r.mesesComDados > 0 && ` · ${r.mesesComDados} ${r.mesesComDados === 1 ? 'mês' : 'meses'} com lançamento`}
                    {r.crescimentoMensal !== null && ` · ${pct(r.crescimentoMensal)} ao mês`}
                  </p>
                </div>

                <Sparkline serie={r.serie} cor={t.cor} />

                <div className="flex shrink-0 items-center gap-3">
                  <span className="min-w-[5.5rem] text-right">
                    <span className={`block font-serif text-xl tabular-nums ${
                      r.crescimentoTotal === null ? 'text-text-muted'
                        : r.crescimentoTotal >= 0 ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {pct(r.crescimentoTotal)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">desde o início</span>
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${t.classe}`} title={`Variação recente: ${pct(r.crescimentoPct)}`}>
                    {t.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        <span className="text-text">Desde o início</span> compara o primeiro mês em que a barbearia faturou
        com o mês mais recente, varrendo todo o histórico — não só a janela do gráfico. O marco não é a data
        de cadastro: conta criada em um mês e primeiro lançamento semanas depois faria o crescimento explodir
        do nada. Quem só tem um mês de dados fica sem percentual, porque não há o que comparar.
        A etiqueta de tendência olha o movimento recente (último ciclo fechado contra o anterior), e o mês em
        curso aparece tracejado no gráfico por estar incompleto. O faturamento segue a mesma regra do painel
        do dono: o valor informado nas metas quando preenchido, senão a soma dos lançamentos dos barbeiros ativos.
      </p>
    </div>
  )
}
