'use client'

import { useMemo, useState, useTransition } from 'react'
import { formatBRL } from '@/lib/utils'
import { salvarLancamentosDiarios, definirSaldoMes } from './actions'

type BarbeiroLite = { id: string; nome: string; foto_url: string | null; tipo: 'barbeiro' | 'recepcionista' }

interface LancamentoDia {
  barbeiro_id: string
  data: string
  valor: number
  faturamento_geral: number
  numero_atendimentos: number
  atendimentos_geral: number
}

interface Props {
  barbeiros: BarbeiroLite[]
  lancamentosDiarios: LancamentoDia[]
  faturamentoMes: number
  totalComissoesMes: number
  saldoPorBarbeiro: Record<string, { comissao: number; atendimentos: number }>
  faturamentoCasaAtual: number
  atendimentosCasaAtual: number
  mesTemSaldo: boolean
  mes: number
  ano: number
}

function pad2(n: number) { return String(n).padStart(2, '0') }

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

interface SaldoSecaoProps {
  barbeiros: BarbeiroLite[]
  saldoPorBarbeiro: Record<string, { comissao: number; atendimentos: number }>
  faturamentoCasaAtual: number
  atendimentosCasaAtual: number
  mes: number
  ano: number
  // Quando true, abre por padrão (cliente sem saldo do mês ainda)
  abrirPorPadrao: boolean
}

/**
 * Seção colapsável com o "saldo acumulado do mês" — usado quando o dono
 * compra o sistema no meio do mês e quer informar quanto cada barbeiro
 * já fez ATÉ HOJE. Sobrescreve os totais em `lancamentos` e `metas`.
 * Os lançamentos do dia continuam somando deltas em cima do saldo.
 */
function AjustarSaldoMesSecao({
  barbeiros, saldoPorBarbeiro, faturamentoCasaAtual, atendimentosCasaAtual, mes, ano, abrirPorPadrao,
}: SaldoSecaoProps) {
  const [aberta, setAberta] = useState(abrirPorPadrao)
  const [comissoes, setComissoes] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, saldoPorBarbeiro[b.id]?.comissao ? String(saldoPorBarbeiro[b.id].comissao) : ''])),
  )
  const [atendimentos, setAtendimentos] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, saldoPorBarbeiro[b.id]?.atendimentos ? String(saldoPorBarbeiro[b.id].atendimentos) : ''])),
  )
  const [fatCasa, setFatCasa] = useState<string>(faturamentoCasaAtual > 0 ? String(faturamentoCasaAtual) : '')
  const [atendCasa, setAtendCasa] = useState<string>(atendimentosCasaAtual > 0 ? String(atendimentosCasaAtual) : '')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    setErro(null)
    setSucesso(false)
    const itens = barbeiros.map(b => ({
      barbeiro_id: b.id,
      comissao_acumulada: parseFloat(comissoes[b.id] || '0') || 0,
      numero_atendimentos: parseInt(atendimentos[b.id] || '0') || 0,
    }))
    const fatCasaNum = parseFloat(fatCasa || '0') || 0
    const atendCasaNum = parseInt(atendCasa || '0') || 0

    startTransition(async () => {
      const res = await definirSaldoMes(itens, fatCasaNum, atendCasaNum, mes, ano)
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2500)
    })
  }

  return (
    <div id="saldo-acumulado" className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-primary/10 transition-colors text-left"
      >
        <span className="text-xl shrink-0">📊</span>
        <div className="flex-1 min-w-0">
          <p className="text-text font-sans font-semibold text-sm">
            Saldo acumulado {abrirPorPadrao ? '(comece por aqui)' : 'do mês'}
          </p>
          <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
            Lance quanto cada barbeiro já fez de comissão e atendimentos no mês até hoje.
            A partir daí, os lançamentos do dia somam em cima.
          </p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${aberta ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {aberta && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-primary/15">

          {/* Total da casa */}
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
            <p className="text-text text-xs font-sans font-semibold uppercase tracking-wide">
              Total acumulado da barbearia
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="text-text-muted text-[11px] font-sans">Faturamento acumulado</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-text-muted text-sm font-sans shrink-0">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={fatCasa}
                    onChange={e => setFatCasa(e.target.value)}
                    className="input flex-1 py-2 text-base font-serif"
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
                  value={atendCasa}
                  onChange={e => setAtendCasa(e.target.value)}
                  className="input w-full py-2 text-base font-serif mt-1 text-center"
                />
              </div>
            </div>
          </div>

          {/* Por barbeiro */}
          <div>
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">
              Comissão acumulada por barbeiro
            </p>
            <p className="text-text-muted text-[11px] font-sans mb-2.5 leading-snug">
              Quanto <span className="text-text font-semibold">cada barbeiro já recebeu de comissão</span> e quantos atendimentos fez até hoje.
            </p>
            <div className="space-y-2">
              {barbeiros.map(b => (
                <div key={b.id} className="bg-surface-2 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center font-serif text-xs text-text-muted shrink-0 overflow-hidden">
                      {b.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                      ) : b.nome[0]}
                    </div>
                    <p className="font-sans text-sm text-text flex-1 min-w-0 truncate">{b.nome}</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <label className="text-text-muted text-[11px] font-sans">Comissão acumulada até hoje</label>
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
                    <div className="w-20">
                      <label className="text-text-muted text-[11px] font-sans">Atend.</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={atendimentos[b.id] ?? ''}
                        onChange={e => setAtendimentos(v => ({ ...v, [b.id]: e.target.value }))}
                        className="input w-full py-1.5 text-sm text-center mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

          <button
            onClick={salvar}
            disabled={isPending}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {sucesso ? '✓ Saldo salvo!' : isPending ? 'Salvando…' : 'Salvar saldo acumulado'}
          </button>
        </div>
      )}
    </div>
  )
}

function formatDataLabel(iso: string): string {
  // 'YYYY-MM-DD' → 'sex, 17 mai' (sem timezone trick)
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(a, m - 1, d)
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dias[dia.getDay()]}, ${d} ${meses[m - 1]}`
}

export default function LancamentoDiarioClient({
  barbeiros,
  lancamentosDiarios,
  faturamentoMes,
  totalComissoesMes,
  saldoPorBarbeiro,
  faturamentoCasaAtual,
  atendimentosCasaAtual,
  mesTemSaldo,
  mes,
  ano,
}: Props) {
  const [dataSel, setDataSel] = useState<string>(todayIso())
  const [valores, setValores] = useState<Record<string, string>>({})
  const [atendBarb, setAtendBarb] = useState<Record<string, string>>({})
  const [fatGeral, setFatGeral] = useState<string>('')
  const [atendGeral, setAtendGeral] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Agrupa lançamentos por data
  const porData = useMemo(() => {
    const agg: Record<string, {
      valoresPorBarbeiro: Record<string, number>
      atendPorBarbeiro: Record<string, number>
      faturamentoGeral: number
      atendimentosGeral: number
      totalDia: number
    }> = {}
    for (const r of lancamentosDiarios) {
      const cur = agg[r.data] ?? {
        valoresPorBarbeiro: {},
        atendPorBarbeiro: {},
        faturamentoGeral: 0,
        atendimentosGeral: 0,
        totalDia: 0,
      }
      cur.valoresPorBarbeiro[r.barbeiro_id] = Number(r.valor) || 0
      cur.atendPorBarbeiro[r.barbeiro_id] = Number(r.numero_atendimentos) || 0
      cur.faturamentoGeral = Math.max(cur.faturamentoGeral, Number(r.faturamento_geral) || 0)
      cur.atendimentosGeral = Math.max(cur.atendimentosGeral, Number(r.atendimentos_geral) || 0)
      agg[r.data] = cur
    }
    for (const data of Object.keys(agg)) {
      const totals: number[] = Object.values(agg[data].valoresPorBarbeiro)
      agg[data].totalDia = totals.reduce((s: number, n: number) => s + n, 0)
    }
    return agg
  }, [lancamentosDiarios])

  // Histórico ordenado (mais recente primeiro), só os 7 mais recentes
  const historico = useMemo(() => {
    return Object.entries(porData)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
  }, [porData])

  // Quando a data selecionada muda, pré-preenche os campos com o que já está salvo
  function selecionarData(novaData: string) {
    setDataSel(novaData)
    setErro(null)
    setSucesso(false)
    const ja = porData[novaData]
    if (ja) {
      const v: Record<string, string> = {}
      const a: Record<string, string> = {}
      for (const [bid, val] of Object.entries(ja.valoresPorBarbeiro)) {
        v[bid] = (val as number) > 0 ? String(val) : ''
      }
      for (const [bid, qtd] of Object.entries(ja.atendPorBarbeiro)) {
        a[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
      setValores(v)
      setAtendBarb(a)
      setFatGeral(ja.faturamentoGeral > 0 ? String(ja.faturamentoGeral) : '')
      setAtendGeral(ja.atendimentosGeral > 0 ? String(ja.atendimentosGeral) : '')
    } else {
      setValores({})
      setAtendBarb({})
      setFatGeral('')
      setAtendGeral('')
    }
  }

  // Inicializa com hoje (executa só na 1a render)
  useMemo(() => {
    const ja = porData[dataSel]
    if (ja) {
      const v: Record<string, string> = {}
      const a: Record<string, string> = {}
      for (const [bid, val] of Object.entries(ja.valoresPorBarbeiro)) {
        v[bid] = (val as number) > 0 ? String(val) : ''
      }
      for (const [bid, qtd] of Object.entries(ja.atendPorBarbeiro)) {
        a[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
      setValores(v)
      setAtendBarb(a)
      setFatGeral(ja.faturamentoGeral > 0 ? String(ja.faturamentoGeral) : '')
      setAtendGeral(ja.atendimentosGeral > 0 ? String(ja.atendimentosGeral) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Soma "ao vivo" dos inputs (preview enquanto o usuário digita)
  const somaDiaAtual = Object.values(valores).reduce((s: number, v: string) => s + (parseFloat(v) || 0), 0)

  function salvar() {
    setErro(null)
    setSucesso(false)
    const lancamentos = barbeiros.map(b => ({
      barbeiro_id: b.id,
      valor: parseFloat(valores[b.id] || '0') || 0,
      atendimentos: parseInt(atendBarb[b.id] || '0') || 0,
    }))
    const fatGeralNum = parseFloat(fatGeral || '0') || 0
    const atendGeralNum = parseInt(atendGeral || '0') || 0

    startTransition(async () => {
      const res = await salvarLancamentosDiarios(lancamentos, dataSel, fatGeralNum, atendGeralNum)
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2200)
    })
  }

  const ehHoje = dataSel === todayIso()
  const diasDoMes = new Date(ano, mes, 0).getDate()

  return (
    <div className="space-y-6">

      {/* Banner pra mês sem saldo (compra no meio do mês) */}
      {/* Acumulado do mês */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">Faturamento do mês</p>
          <p className="font-serif text-xl sm:text-2xl text-text mt-1">{formatBRL(faturamentoMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">Comissões do mês</p>
          <p className="font-serif text-xl sm:text-2xl text-text mt-1">{formatBRL(totalComissoesMes)}</p>
        </div>
      </div>

      {/* Saldo acumulado (seção inline colapsável) — aberta automaticamente se o mês ainda não tem nada lançado */}
      <AjustarSaldoMesSecao
        barbeiros={barbeiros}
        saldoPorBarbeiro={saldoPorBarbeiro}
        faturamentoCasaAtual={faturamentoCasaAtual}
        atendimentosCasaAtual={atendimentosCasaAtual}
        mes={mes}
        ano={ano}
        abrirPorPadrao={!mesTemSaldo}
      />

      {/* Form do dia */}
      <div className="card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Lançar o dia</p>
            <p className="font-serif text-lg text-text capitalize mt-0.5">
              {formatDataLabel(dataSel)}{' '}
              {ehHoje && <span className="text-primary text-sm font-sans">· hoje</span>}
            </p>
          </div>
          <input
            type="date"
            value={dataSel}
            min={`${ano}-${pad2(mes)}-01`}
            max={`${ano}-${pad2(mes)}-${pad2(diasDoMes)}`}
            onChange={e => selecionarData(e.target.value)}
            className="input py-2 text-sm"
          />
        </div>

        {/* Total da casa */}
        <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
          <p className="text-text text-xs font-sans font-semibold uppercase tracking-wide">
            Total da barbearia (caixa)
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="text-text-muted text-[11px] font-sans">Faturamento hoje</label>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-text-muted text-sm font-sans shrink-0">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={fatGeral}
                  onChange={e => setFatGeral(e.target.value)}
                  className="input flex-1 py-2 text-base font-serif"
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
                value={atendGeral}
                onChange={e => setAtendGeral(e.target.value)}
                className="input w-full py-2 text-base font-serif mt-1 text-center"
              />
            </div>
          </div>
        </div>

        {/* Por barbeiro */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide">
              Comissão por barbeiro
            </p>
            <p className="text-text-muted text-xs font-sans">
              Soma: <span className="text-text font-semibold">{formatBRL(somaDiaAtual)}</span>
            </p>
          </div>
          <p className="text-text-muted text-[11px] font-sans mb-2.5 leading-snug">
            Aqui é o valor que <span className="text-text font-semibold">cada barbeiro recebeu</span> (comissão dele), não o faturamento. O faturamento da casa fica no campo acima.
          </p>
          <div className="space-y-2">
            {barbeiros.map(b => (
              <div key={b.id} className="flex items-center gap-2 sm:gap-3 bg-surface-2 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-serif text-sm text-text-muted shrink-0 overflow-hidden">
                  {b.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                  ) : b.nome[0]}
                </div>
                <p className="font-sans text-sm text-text flex-1 min-w-0 truncate">{b.nome}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-text-muted text-xs font-sans">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={valores[b.id] ?? ''}
                    onChange={e => setValores(v => ({ ...v, [b.id]: e.target.value }))}
                    className="input w-20 sm:w-24 py-1.5 text-sm text-right"
                    title="Comissão recebida"
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="atend."
                  value={atendBarb[b.id] ?? ''}
                  onChange={e => setAtendBarb(v => ({ ...v, [b.id]: e.target.value }))}
                  className="input w-16 py-1.5 text-sm text-center shrink-0"
                  title="Atendimentos do dia"
                />
              </div>
            ))}
            {barbeiros.length === 0 && (
              <p className="text-text-muted text-xs font-sans py-2">
                Cadastre um barbeiro em Configurações pra lançar comissões individuais.
              </p>
            )}
          </div>
        </div>

        {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

        <button
          onClick={salvar}
          disabled={isPending}
          className="btn-primary w-full py-3 text-sm"
        >
          {sucesso ? '✓ Salvo!' : isPending ? 'Salvando…' : `Salvar ${ehHoje ? 'lançamento de hoje' : 'lançamento'}`}
        </button>
      </div>

      {/* Histórico */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-text">Últimos dias lançados</h2>
          <p className="text-text-muted text-xs font-sans">
            {historico.length} {historico.length === 1 ? 'dia' : 'dias'}
          </p>
        </div>

        {historico.length === 0 ? (
          <p className="text-text-muted text-sm font-sans py-4 text-center">
            Nenhum lançamento ainda neste mês. Comece pelo dia de hoje acima.
          </p>
        ) : (
          <div className="space-y-2">
            {historico.map(([data, info]) => {
              const ativo = data === dataSel
              return (
                <button
                  key={data}
                  onClick={() => selecionarData(data)}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border transition-colors text-left',
                    ativo ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-text-muted',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-sans font-semibold capitalize">
                      {formatDataLabel(data)}
                      {data === todayIso() && <span className="text-primary text-xs ml-2">· hoje</span>}
                    </p>
                    <p className="text-text-muted text-xs font-sans mt-0.5">
                      Faturamento: {formatBRL(info.faturamentoGeral)} · Comissões: {formatBRL(info.totalDia)}
                      {info.atendimentosGeral > 0 && (
                        <> · <span className="text-text">{info.atendimentosGeral}</span> atend.</>
                      )}
                    </p>
                  </div>
                  <span className="text-primary text-xs font-sans shrink-0">editar</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
