'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { formatBRL } from '@/lib/utils'
import { salvarComandasDia, definirAcumuladoMes, buscarComandasDia } from './actions'
import type { ModoMeta, BaseMeta } from '@/lib/modoMeta'
import { mostraFaturamento, mostraComissao, labelBase } from '@/lib/modoMeta'

type BarbeiroLite = { id: string; nome: string; foto_url: string | null; tipo: 'barbeiro' | 'recepcionista' }

interface ComandaDia {
  barbeiro_id: string
  data: string
  numero_atendimentos: number
}

interface Props {
  barbeiros: BarbeiroLite[]
  comandasDiarias: ComandaDia[]
  acumuladoPorBarbeiro: Record<string, {
    valor_faturamento: number;
    valor_comissao: number;
    atendimentos: number;
  }>
  faturamentoCasaAtual: number
  atendimentosCasaAtual: number
  faturamentoMes: number
  totalFaturamentoEquipeMes: number
  totalComissoesMes: number
  totalAtendimentosMes: number
  mes: number
  ano: number
  cicloInicioIso: string
  cicloFimIso: string
  diaFechamento: number
  mostrarFaturamentoGeral: boolean
  modoMeta: ModoMeta
  baseMeta: BaseMeta
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
  atendimentosCasaAtual,
  faturamentoMes,
  totalFaturamentoEquipeMes,
  totalComissoesMes,
  totalAtendimentosMes,
  mes,
  ano,
  cicloInicioIso,
  cicloFimIso,
  diaFechamento,
  mostrarFaturamentoGeral,
  modoMeta,
  baseMeta,
}: Props) {
  const exibeFat = mostraFaturamento(modoMeta)
  const exibeCom = mostraComissao(modoMeta)
  const labelBaseValor = labelBase(modoMeta, baseMeta)

  // ── Estado: ACUMULADO (principal) ───────────────────────
  // Faturamento e Comissão sao mantidos em estados separados — preencho
  // apenas os que o modo da barbearia exibe.
  const [valoresFat, setValoresFat] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.valor_faturamento ? String(acumuladoPorBarbeiro[b.id].valor_faturamento) : ''])),
  )
  const [valoresCom, setValoresCom] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.valor_comissao ? String(acumuladoPorBarbeiro[b.id].valor_comissao) : ''])),
  )
  const [atendAcum, setAtendAcum] = useState<Record<string, string>>(() =>
    Object.fromEntries(barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.atendimentos ? String(acumuladoPorBarbeiro[b.id].atendimentos) : ''])),
  )
  const [fatCasa, setFatCasa] = useState<string>(faturamentoCasaAtual > 0 ? String(faturamentoCasaAtual) : '')
  const [atendCasa, setAtendCasa] = useState<string>(atendimentosCasaAtual > 0 ? String(atendimentosCasaAtual) : '')

  // Re-sincroniza atendimentos quando o servidor atualiza (ex: dono lançou comandas do dia)
  const atendServidorKey = `${atendimentosCasaAtual}|` + barbeiros.map(b => `${b.id}:${acumuladoPorBarbeiro[b.id]?.atendimentos ?? 0}`).join(',')
  useEffect(() => {
    setAtendAcum(Object.fromEntries(
      barbeiros.map(b => [b.id, acumuladoPorBarbeiro[b.id]?.atendimentos ? String(acumuladoPorBarbeiro[b.id].atendimentos) : '']),
    ))
    setAtendCasa(atendimentosCasaAtual > 0 ? String(atendimentosCasaAtual) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atendServidorKey])

  const [erroAcum, setErroAcum] = useState<string | null>(null)
  const [sucessoAcum, setSucessoAcum] = useState(false)
  const [savingAcum, startSaveAcum] = useTransition()

  // ── Estado: COMANDAS DO DIA (secundário) ────────────────
  const hojeStr = todayIso()
  const dataPadrao = hojeStr >= cicloInicioIso && hojeStr <= cicloFimIso ? hojeStr : cicloFimIso
  const [dataSel, setDataSel] = useState<string>(dataPadrao)
  const [comandas, setComandas] = useState<Record<string, string>>({})
  const [erroDia, setErroDia] = useState<string | null>(null)
  const [sucessoDia, setSucessoDia] = useState(false)
  const [savingDia, startSaveDia] = useTransition()

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

  function selecionarData(novaData: string) {
    if (!novaData) return
    if (novaData > todayIso()) return
    setDataSel(novaData)
    setErroDia(null)
    setSucessoDia(false)
    const ja = comandasPorData[novaData]
    if (ja) {
      const v: Record<string, string> = {}
      for (const [bid, qtd] of Object.entries(ja.porBarbeiro)) {
        v[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
      setComandas(v)
      return
    }
    setComandas({})
    buscarComandasDia(novaData).then(res => {
      if ('error' in res) { setErroDia(res.error); return }
      const v: Record<string, string> = {}
      for (const [bid, qtd] of Object.entries(res.porBarbeiro)) {
        v[bid] = (qtd as number) > 0 ? String(qtd) : ''
      }
      setComandas(v)
    }).catch(() => { /* ignore */ })
  }

  function navegarDia(delta: number) {
    const [a, m, d] = dataSel.split('-').map(Number)
    const dt = new Date(a, m - 1, d)
    dt.setDate(dt.getDate() + delta)
    const novo = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    selecionarData(novo)
  }

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

  const comandasDoDiaTotal = (Object.values(comandas) as string[]).reduce<number>((s, v) => s + (parseInt(v || '0', 10) || 0), 0)

  function salvarAcumulado() {
    setErroAcum(null)
    setSucessoAcum(false)
    const itens = barbeiros.map(b => {
      const fat = exibeFat ? (parseFloat(valoresFat[b.id] || '0') || 0) : null
      const com = exibeCom ? (parseFloat(valoresCom[b.id] || '0') || 0) : null
      return {
        barbeiro_id: b.id,
        valor_faturamento: fat,
        valor_comissao: com,
        numero_atendimentos: parseInt(atendAcum[b.id] || '0', 10) || 0,
      }
    })
    const fatNum = parseFloat(fatCasa || '0') || 0
    const atendCasaNum = parseInt(atendCasa || '0', 10) || 0
    startSaveAcum(async () => {
      const res = await definirAcumuladoMes(itens, fatNum, atendCasaNum, mes, ano)
      if (res?.error) { setErroAcum(res.error); return }
      // Se o guard-anti-zerar preservou algum barbeiro, avisa o dono.
      const preservados = (res as { preservados?: number })?.preservados ?? 0
      if (preservados > 0) {
        setErroAcum(`⚠️ ${preservados} barbeiro(s) preservado(s) — os campos vieram vazios/0 e ja havia valor gravado. Digite valores explicitos pra atualizar.`)
        setTimeout(() => setErroAcum(null), 6000)
      } else {
        setSucessoAcum(true)
        setTimeout(() => setSucessoAcum(false), 2200)
      }
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

  // Quantos cards de total exibir no topo
  const cardsTopo: { label: string; valor: string }[] = []
  if (mostrarFaturamentoGeral && exibeFat) {
    cardsTopo.push({ label: 'Faturamento', valor: formatBRL(faturamentoMes) })
  }
  if (exibeCom) {
    cardsTopo.push({ label: 'Comissões', valor: formatBRL(totalComissoesMes) })
  }
  if (!exibeCom && exibeFat && mostrarFaturamentoGeral) {
    // Modo 'faturamento' puro — mostra tambem total da equipe pra dar contexto
    cardsTopo.push({ label: 'Equipe', valor: formatBRL(totalFaturamentoEquipeMes) })
  }
  cardsTopo.push({ label: 'Atendimentos', valor: String(totalAtendimentosMes) })

  const gridColsTopo = cardsTopo.length === 4 ? 'grid-cols-2 sm:grid-cols-4'
    : cardsTopo.length === 3 ? 'grid-cols-3'
    : cardsTopo.length === 2 ? 'grid-cols-2'
    : 'grid-cols-1'

  return (
    <div className="space-y-6">

      {/* Banner do modo atual */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-text text-xs sm:text-sm font-sans">
          Modo atual: <span className="font-semibold">{
            modoMeta === 'ambos' ? `Faturamento + Comissão (meta/ranking por ${labelBaseValor})`
            : modoMeta === 'faturamento' ? 'Faturamento'
            : 'Comissão'
          }</span>
          <span className="text-text-muted ml-2">· trocar em Configurações → Operação</span>
        </p>
      </div>

      {/* Resumo do mês */}
      <div className={`grid ${gridColsTopo} gap-3`}>
        {cardsTopo.map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-text-muted text-[10px] sm:text-xs font-sans uppercase tracking-wide">{c.label}</p>
            <p className="font-serif text-lg sm:text-2xl text-text mt-1">{c.valor}</p>
          </div>
        ))}
      </div>

      {/* ── SEÇÃO PRINCIPAL: Acumulado do mês ───────────────── */}
      <div className="card p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-serif text-lg text-text">Acumulado do {diaFechamento === 1 ? 'mês' : 'ciclo'}</h2>
          <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
            O número oficial do mês. Edite aqui o faturamento da casa e o valor de cada barbeiro.
          </p>
        </div>

        {/* Total da casa: faturamento + atendimentos */}
        <div className="bg-surface-2 border border-border rounded-xl px-4 py-4 space-y-3">
          <label className="text-text text-xs font-sans font-semibold uppercase tracking-wide">
            Total da barbearia
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <p className="text-text-muted text-[11px] font-sans mb-1">Faturamento</p>
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
            <div className="w-28">
              <p className="text-text-muted text-[11px] font-sans mb-1">Atendimentos</p>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={atendCasa}
                onChange={e => setAtendCasa(e.target.value)}
                className="input w-full py-2 text-lg font-serif text-center"
              />
            </div>
          </div>
          <p className="text-text-muted text-[11px] font-sans leading-snug">
            Total de comandas/atendimentos do mês na barbearia — usado no ticket médio da casa.
          </p>
        </div>

        {/* Valores por barbeiro */}
        <div>
          <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">Por barbeiro</p>
          <p className="text-text-muted text-[11px] font-sans mb-2.5 leading-snug">
            {modoMeta === 'ambos'
              ? 'Preencha o faturamento E a comissão de cada um (você definiu os dois). Meta e ranking contam pelo ' + labelBaseValor.toLowerCase() + '.'
              : modoMeta === 'comissao'
              ? <>Comissão que <span className="text-text font-semibold">cada um já recebeu</span> no mês. Quem entrou no meio: lance o total agora.</>
              : <>Faturamento que <span className="text-text font-semibold">cada um já fez</span> no mês. Quem entrou no meio: lance o total agora.</>
            }
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
                {modoMeta === 'ambos' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2">
                    <div>
                      <label className="text-text-muted text-[11px] font-sans">
                        Faturamento {baseMeta === 'faturamento' && <span className="text-[#D4A85A]">·meta</span>}
                      </label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-text-muted text-xs font-sans shrink-0">R$</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0"
                          value={valoresFat[b.id] ?? ''}
                          onChange={e => setValoresFat(v => ({ ...v, [b.id]: e.target.value }))}
                          className="input flex-1 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-text-muted text-[11px] font-sans">
                        Comissão {baseMeta === 'comissao' && <span className="text-[#D4A85A]">·meta</span>}
                      </label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-text-muted text-xs font-sans shrink-0">R$</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0"
                          value={valoresCom[b.id] ?? ''}
                          onChange={e => setValoresCom(v => ({ ...v, [b.id]: e.target.value }))}
                          className="input flex-1 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 sm:w-24">
                      <label className="text-text-muted text-[11px] font-sans">Atendimentos</label>
                      <input
                        type="number" min="0" step="1" placeholder="0"
                        value={atendAcum[b.id] ?? ''}
                        onChange={e => setAtendAcum(v => ({ ...v, [b.id]: e.target.value }))}
                        className="input w-full py-1.5 text-sm text-center mt-0.5"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <label className="text-text-muted text-[11px] font-sans">{labelBaseValor} acumulado</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-text-muted text-xs font-sans shrink-0">R$</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0"
                          value={(modoMeta === 'comissao' ? valoresCom : valoresFat)[b.id] ?? ''}
                          onChange={e => {
                            const upd = (v: Record<string, string>) => ({ ...v, [b.id]: e.target.value })
                            if (modoMeta === 'comissao') setValoresCom(upd)
                            else setValoresFat(upd)
                          }}
                          className="input flex-1 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="text-text-muted text-[11px] font-sans">Atendimentos</label>
                      <input
                        type="number" min="0" step="1" placeholder="0"
                        value={atendAcum[b.id] ?? ''}
                        onChange={e => setAtendAcum(v => ({ ...v, [b.id]: e.target.value }))}
                        className="input w-full py-1.5 text-sm text-center mt-0.5"
                      />
                    </div>
                  </div>
                )}
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
          {sucessoAcum ? '✓ Salvo!' : savingAcum ? 'Salvando…' : `Salvar acumulado do ${diaFechamento === 1 ? 'mês' : 'ciclo'}`}
        </button>
      </div>

      {/* ── SEÇÃO SECUNDÁRIA: Comandas do dia ───────────────── */}
      <div className={[
        'card p-5 sm:p-6 space-y-4 transition-colors',
        !ehHoje ? 'border-amber-500/40 bg-amber-500/[0.04]' : '',
      ].join(' ')}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-serif text-lg text-text">Comandas do dia</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5 leading-relaxed">
              Quantas comandas cada barbeiro fez. Soma no total de atendimentos do mês.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navegarDia(-1)}
              aria-label="Dia anterior"
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <input
              type="date"
              value={dataSel}
              max={todayIso()}
              onChange={e => selecionarData(e.target.value)}
              className="input py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => navegarDia(1)}
              disabled={dataSel >= todayIso()}
              aria-label="Próximo dia"
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {(dataSel < cicloInicioIso || dataSel > cicloFimIso) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-200 text-xs font-sans leading-relaxed">
              ⚠️ Você está lançando em <span className="font-semibold capitalize">{formatDataLabel(dataSel)}</span>, fora do ciclo atual. Confirme antes de salvar.
            </p>
          </div>
        )}

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
