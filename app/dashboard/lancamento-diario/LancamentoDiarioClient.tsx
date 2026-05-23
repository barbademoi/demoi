'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { formatBRL } from '@/lib/utils'
import { salvarComandasDia, definirAcumuladoMes } from './actions'

type BarbeiroLite = { id: string; nome: string; foto_url: string | null; tipo: 'barbeiro' | 'recepcionista' }

interface ComandaDia {
  barbeiro_id: string
  data: string
  numero_atendimentos: number
}

interface Props {
  barbeiros: BarbeiroLite[]
  comandasDiarias: ComandaDia[]
  acumuladoPorBarbeiro: Record<string, { comissao: number; atendimentos: number }>
  faturamentoCasaAtual: number
  faturamentoMes: number
  totalComissoesMes: number
  totalAtendimentosMes: number
  mes: number
  ano: number
}

function pad2(n: number) { return String(n).padStart(2, '0') }

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatDataLabel(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(a, m - 1, d)
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  return `${dias[dia.getDay()]}, ${d} ${meses[m - 1]}`
}

export default function LancamentoDiarioClient({
  barbeiros,
  comandasDiarias,
  acumuladoPorBarbeiro,
  faturamentoCasaAtual,
  faturamentoMes,
  totalComissoesMes,
  totalAtendimentosMes,
  mes,
  ano,
}: Props) {
  // ── Estado: ACUMULADO (principal) ───────────────────────
  const [comissoes, setComissoes] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.comissao ? String(acumuladoPorBarbeiro[b.id].comissao) : ''])),
  )
  const [atendAcum, setAtendAcum] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.atendimentos ? String(acumuladoPorBarbeiro[b.id].atendimentos) : ''])),
  )
  const [fatCasa, setFatCasa] = useState<string>(faturamentoCasaAtual > 0 ? String(faturamentoCasaAtual) : '')

  // Quando o servidor atualiza os atendimentos (ex: dono lançou comandas do dia),
  // re-sincroniza o campo do acumulado pra não sobrescrever com valor velho ao salvar.
  // Dep serializada = só dispara quando o valor PERSISTIDO muda, não a cada digitação.
  const atendServidorKey = barbeiros.map(b => `${b.id}:${acumuladoPorBarbeiro[b.id]?.atendimentos ?? 0}`).join(',')
  useEffect(() => {
    setAtendAcum(Object.fromEntries(
      barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.atendimentos ? String(acumuladoPorBarbeiro[b.id].atendimentos) : '']),
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atendServidorKey])

  const [erroAcum, setErroAcum] = useState<string | null>(null)
  const [sucessoAcum, setSucessoAcum] = useState(false)
  const [savingAcum, startSaveAcum] = useTransition()

  // ── Estado: COMANDAS DO DIA (secundário) ────────────────
  const [dataSel, setDataSel] = useState<string>(todayIso())
  const [comandas, setComandas] = useState<Record<string, string>>({})
  const [erroDia, setErroDia] = useState<string | null>(null)
  const [sucessoDia, setSucessoDia] = useState(false)
  const [savingDia, startSaveDia] = useTransition()

  // Agrupa comandas por data (histórico + pré-preenchimento)
  const comandasPorData = useMemo(() => {
    const agg: Record<string, { porBarbeiro: Record<string, number>; total: number }> = {}
    for (const r of comandasDiarias) {
      const cur = agg[r.data] ?? { porBarbeiro: {}, total: 0 }
      const qtd = Number(r.numero_atendimentos) || 0
      cur.porBarbeiro[r.barbeiro_id] = qtd
      agg[r.data] = cur
    }
    for (const data of Object.keys(agg)) {
      const vals: number[] = Object.values(agg[data].porBarbeiro)
      agg[data].total = vals.reduce((s: number, n: number) => s + n, 0)
    }
    return agg
  }, [comandasDiarias])

  const historico = useMemo(
    () => Object.entries(comandasPorData).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10),
    [comandasPorData],
  )

  // Pré-preenche comandas ao trocar a data
  function selecionarData(novaData: string) {
    setDataSel(novaData)
    setErroDia(null)
    setSucessoDia(false)
    const ja = comandasPorData[novaData]
    const v: Record<string, string> = {}
    if (ja) {
      for (const [bid, qtd] of Object.entries(ja.porBarbeiro)) {
        v[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
    }
    setComandas(v)
  }

  // Inicializa comandas com o dia de hoje (1a render)
  useMemo(() => {
    const ja = comandasPorData[dataSel]
    if (ja) {
      const v: Record<string, string> = {}
      for (const [bid, qtd] of Object.entries(ja.porBarbeiro)) {
        v[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
      setComandas(v)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const comandasDoDiaTotal = Object.values(comandas).reduce((s: number, v: string) => s + (parseInt(v || '0', 10) || 0), 0)

  function salvarAcumulado() {
    setErroAcum(null)
    setSucessoAcum(false)
    const itens = barbeiros.map(b => ({
      barbeiro_id: b.id,
      comissao_acumulada: parseFloat(comissoes[b.id] || '0') || 0,
      numero_atendimentos: parseInt(atendAcum[b.id] || '0', 10) || 0,
    }))
    const fatNum = parseFloat(fatCasa || '0') || 0
    startSaveAcum(async () => {
      const res = await definirAcumuladoMes(itens, fatNum, mes, ano)
      if (res?.error) { setErroAcum(res.error); return }
      setSucessoAcum(true)
      setTimeout(() => setSucessoAcum(false), 2200)
    })
  }

  function salvarComandas() {
    setErroDia(null)
    setSucessoDia(false)
    const itens = barbeiros.map(b => ({
      barbeiro_id: b.id,
      comandas: parseInt(comandas[b.id] || '0', 10) || 0,
    }))
    startSaveDia(async () => {
      const res = await salvarComandasDia(itens, dataSel)
      if (res?.error) { setErroDia(res.error); return }
      setSucessoDia(true)
      setTimeout(() => setSucessoDia(false), 2200)
    })
  }

  const ehHoje = dataSel === todayIso()
  const diasNoMes = new Date(ano, mes, 0).getDate()

  return (
    <div className="space-y-6">

      {/* Resumo do mês */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">Faturamento</p>
          <p className="font-serif text-lg sm:text-2xl text-text mt-1">{formatBRL(faturamentoMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">Comissões</p>
          <p className="font-serif text-lg sm:text-2xl text-text mt-1">{formatBRL(totalComissoesMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">Atendimentos</p>
          <p className="font-serif text-lg sm:text-2xl text-text mt-1">{totalAtendimentosMes}</p>
        </div>
      </div>

      {/* ── SEÇÃO PRINCIPAL: Acumulado do mês ───────────────── */}
      <div className="card p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-serif text-lg text-text">Acumulado do mês</h2>
          <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
            O número oficial do mês. Edite aqui o faturamento da casa e a comissão de cada barbeiro.
          </p>
        </div>

        {/* Faturamento total da casa */}
        <div className="bg-surface-2 border border-border rounded-xl px-4 py-4 space-y-2">
          <label className="text-text text-xs font-sans font-semibold uppercase tracking-wide">
            Faturamento total da barbearia
          </label>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm font-sans shrink-0">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={fatCasa}
              onChange={e => setFatCasa(e.target.value)}
              className="input flex-1 py-2 text-lg font-serif"
            />
          </div>
        </div>

        {/* Comissão + atendimentos por barbeiro */}
        <div>
          <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">Por barbeiro</p>
          <p className="text-text-muted text-[11px] font-sans mb-2.5 leading-snug">
            Comissão que <span className="text-text font-semibold">cada um já recebeu</span> e total de atendimentos no mês.
            Quem entrou no meio do mês: lance o total de atendimentos aqui — depois use &ldquo;Comandas do dia&rdquo;.
          </p>
          <div className="space-y-2">
            {barbeiros.map(b => (
              <div key={b.id} className="bg-surface-2 rounded-xl px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-serif text-sm text-text-muted shrink-0 overflow-hidden">
                    {b.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                    ) : b.nome[0]}
                  </div>
                  <p className="font-sans text-sm text-text flex-1 min-w-0 truncate">{b.nome}</p>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <label className="text-text-muted text-[11px] font-sans">Comissão acumulada</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-text-muted text-xs font-sans shrink-0">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={comissoes[b.id] ?? ''}
                        onChange={e => setComissoes(v => ({ ...v, [b.id]: e.target.value }))}
                        className="input flex-1 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="text-text-muted text-[11px] font-sans">Atendimentos</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={atendAcum[b.id] ?? ''}
                      onChange={e => setAtendAcum(v => ({ ...v, [b.id]: e.target.value }))}
                      className="input w-full py-1.5 text-sm text-center mt-0.5"
                    />
                  </div>
                </div>
              </div>
            ))}
            {barbeiros.length === 0 && (
              <p className="text-text-muted text-xs font-sans py-2">
                Cadastre um barbeiro em Configurações primeiro.
              </p>
            )}
          </div>
        </div>

        {erroAcum && <p className="text-red-400 text-sm font-sans">{erroAcum}</p>}

        <button onClick={salvarAcumulado} disabled={savingAcum} className="btn-primary w-full py-3 text-sm">
          {sucessoAcum ? '✓ Salvo!' : savingAcum ? 'Salvando…' : 'Salvar acumulado do mês'}
        </button>
      </div>

      {/* ── SEÇÃO SECUNDÁRIA: Comandas do dia ───────────────── */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-serif text-lg text-text">Comandas do dia</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
              Quantas comandas cada barbeiro fez. Soma no total de atendimentos do mês.
            </p>
          </div>
          <input
            type="date"
            value={dataSel}
            min={`${ano}-${pad2(mes)}-01`}
            max={`${ano}-${pad2(mes)}-${pad2(diasNoMes)}`}
            onChange={e => selecionarData(e.target.value)}
            className="input py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="font-serif text-base text-text capitalize">
            {formatDataLabel(dataSel)}{ehHoje && <span className="text-primary text-sm font-sans"> · hoje</span>}
          </p>
          <p className="text-text-muted text-xs font-sans">
            Total: <span className="text-text font-semibold">{comandasDoDiaTotal}</span>
          </p>
        </div>

        <div className="space-y-2">
          {barbeiros.map(b => (
            <div key={b.id} className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-serif text-sm text-text-muted shrink-0 overflow-hidden">
                {b.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                ) : b.nome[0]}
              </div>
              <p className="font-sans text-sm text-text flex-1 min-w-0 truncate">{b.nome}</p>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={comandas[b.id] ?? ''}
                onChange={e => setComandas(v => ({ ...v, [b.id]: e.target.value }))}
                className="input w-20 py-1.5 text-sm text-center"
              />
              <span className="text-text-muted text-[11px] font-sans w-16 shrink-0">comandas</span>
            </div>
          ))}
        </div>

        {erroDia && <p className="text-red-400 text-sm font-sans">{erroDia}</p>}

        <button onClick={salvarComandas} disabled={savingDia || barbeiros.length === 0} className="btn-primary w-full py-3 text-sm">
          {sucessoDia ? '✓ Salvo!' : savingDia ? 'Salvando…' : `Salvar comandas ${ehHoje ? 'de hoje' : 'do dia'}`}
        </button>

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="pt-2">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2">Últimos dias lançados</p>
            <div className="space-y-1.5">
              {historico.map(([data, info]) => (
                <button
                  key={data}
                  onClick={() => selecionarData(data)}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors text-left text-sm',
                    data === dataSel ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-text-muted',
                  ].join(' ')}
                >
                  <span className="text-text font-sans capitalize">
                    {formatDataLabel(data)}
                    {data === todayIso() && <span className="text-primary text-xs ml-1.5">· hoje</span>}
                  </span>
                  <span className="text-text-muted font-sans text-xs">{info.total} comandas</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
