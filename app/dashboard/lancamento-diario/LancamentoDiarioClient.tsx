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

interface ModalProps {
  barbeiros: BarbeiroLite[]
  saldoPorBarbeiro: Record<string, { comissao: number; atendimentos: number }>
  faturamentoCasaAtual: number
  atendimentosCasaAtual: number
  mes: number
  ano: number
  onClose: () => void
}

function AjustarSaldoMesModal({
  barbeiros, saldoPorBarbeiro, faturamentoCasaAtual, atendimentosCasaAtual, mes, ano, onClose,
}: ModalProps) {
  const [comissoes, setComissoes] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, String(saldoPorBarbeiro[b.id]?.comissao ?? '')])),
  )
  const [atendimentos, setAtendimentos] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, String(saldoPorBarbeiro[b.id]?.atendimentos ?? '')])),
  )
  const [fatCasa, setFatCasa] = useState<string>(faturamentoCasaAtual > 0 ? String(faturamentoCasaAtual) : '')
  const [atendCasa, setAtendCasa] = useState<string>(atendimentosCasaAtual > 0 ? String(atendimentosCasaAtual) : '')
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    setErro(null)
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
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-xl text-text">Ajustar saldo do mês</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              Sobrescreve os totais. Os lançamentos do dia continuam somando depois.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Faturamento total da casa */}
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
            <p className="text-text text-xs font-sans font-semibold uppercase tracking-wide">
              Total da barbearia
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted text-xs font-sans">Faturamento</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-text-muted text-sm font-sans shrink-0">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={fatCasa}
                    onChange={e => setFatCasa(e.target.value)}
                    className="input flex-1 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-text-muted text-xs font-sans">Atendimentos</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={atendCasa}
                  onChange={e => setAtendCasa(e.target.value)}
                  className="input w-full py-1.5 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Por barbeiro */}
          <div>
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2">Por barbeiro</p>
            <div className="space-y-2.5">
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
                  <div className="grid grid-cols-2 gap-2">
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
                          className="input flex-1 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-text-muted text-[11px] font-sans">Atendimentos</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={atendimentos[b.id] ?? ''}
                        onChange={e => setAtendimentos(v => ({ ...v, [b.id]: e.target.value }))}
                        className="input w-full py-1 text-sm mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 text-sm py-2.5">Cancelar</button>
          <button onClick={salvar} disabled={isPending} className="btn-primary flex-1 text-sm py-2.5">
            {isPending ? 'Salvando…' : 'Salvar saldo'}
          </button>
        </div>
      </div>
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
  const [saldoOpen, setSaldoOpen] = useState(false)
  const [dataSel, setDataSel] = useState<string>(todayIso())
  const [valores, setValores] = useState<Record<string, string>>({})
  const [fatGeral, setFatGeral] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Agrupa lançamentos por data
  const porData = useMemo(() => {
    const agg: Record<string, { valoresPorBarbeiro: Record<string, number>; faturamentoGeral: number; totalDia: number }> = {}
    for (const r of lancamentosDiarios) {
      const cur = agg[r.data] ?? { valoresPorBarbeiro: {}, faturamentoGeral: 0, totalDia: 0 }
      cur.valoresPorBarbeiro[r.barbeiro_id] = Number(r.valor) || 0
      cur.faturamentoGeral = Math.max(cur.faturamentoGeral, Number(r.faturamento_geral) || 0)
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
      for (const [bid, val] of Object.entries(ja.valoresPorBarbeiro)) {
        v[bid] = (val as number) > 0 ? String(val) : ''
      }
      setValores(v)
      setFatGeral(ja.faturamentoGeral > 0 ? String(ja.faturamentoGeral) : '')
    } else {
      setValores({})
      setFatGeral('')
    }
  }

  // Inicializa com hoje (executa só na 1a render)
  useMemo(() => {
    const ja = porData[dataSel]
    if (ja) {
      const v: Record<string, string> = {}
      for (const [bid, val] of Object.entries(ja.valoresPorBarbeiro)) {
        v[bid] = (val as number) > 0 ? String(val) : ''
      }
      setValores(v)
      setFatGeral(ja.faturamentoGeral > 0 ? String(ja.faturamentoGeral) : '')
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
    }))
    const fatGeralNum = parseFloat(fatGeral || '0') || 0

    startTransition(async () => {
      const res = await salvarLancamentosDiarios(lancamentos, dataSel, fatGeralNum)
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
      {!mesTemSaldo && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-text font-sans font-semibold text-sm sm:text-base mb-1">
                Começando no meio do mês?
              </p>
              <p className="text-text-muted text-xs sm:text-sm font-sans leading-relaxed mb-3">
                Se você já vendeu antes de entrar no BarberMeta, defina o saldo
                acumulado do mês. Depois disso, é só lançar o dia normalmente —
                a soma continua do ponto que você definir.
              </p>
              <button
                onClick={() => setSaldoOpen(true)}
                className="btn-primary text-sm py-2 px-4"
              >
                Definir saldo acumulado →
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Link discreto pra reabrir o ajuste do saldo */}
      {mesTemSaldo && (
        <button
          onClick={() => setSaldoOpen(true)}
          className="text-text-muted text-xs font-sans hover:text-text transition-colors underline w-full text-center sm:text-left"
        >
          Ajustar saldo do mês
        </button>
      )}

      {saldoOpen && (
        <AjustarSaldoMesModal
          barbeiros={barbeiros}
          saldoPorBarbeiro={saldoPorBarbeiro}
          faturamentoCasaAtual={faturamentoCasaAtual}
          atendimentosCasaAtual={atendimentosCasaAtual}
          mes={mes}
          ano={ano}
          onClose={() => setSaldoOpen(false)}
        />
      )}

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
              value={fatGeral}
              onChange={e => setFatGeral(e.target.value)}
              className="input flex-1 py-2 text-lg font-serif"
            />
          </div>
        </div>

        {/* Por barbeiro */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Comissões individuais</p>
            <p className="text-text-muted text-xs font-sans">
              Soma: <span className="text-text font-semibold">{formatBRL(somaDiaAtual)}</span>
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-text-muted text-sm font-sans">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={valores[b.id] ?? ''}
                    onChange={e => setValores(v => ({ ...v, [b.id]: e.target.value }))}
                    className="input w-28 py-1.5 text-sm text-right"
                  />
                </div>
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
