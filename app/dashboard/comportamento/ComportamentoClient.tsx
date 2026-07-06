'use client'

import { useState, useMemo, useTransition } from 'react'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import {
  toggleComportamento,
  criarRegra, atualizarRegra, toggleRegraAtiva, excluirRegra,
  registrarOcorrencia, excluirOcorrencia,
} from './actions'
import type { RegraConduta } from '@/types/database'

interface Barbeiro { id: string; nome: string; tipo: string }

interface OcorrenciaView {
  id: string
  barbeiro_id: string
  barbeiroNome: string
  descricao: string | null
  valor: number
  data: string
}

interface CicloNav {
  mes: number; ano: number; mesAtual: number; anoAtual: number
  diaFechamento: number; podeVoltar: boolean; podeAvancar: boolean; label: string
}

interface Props {
  ativoInicial: boolean
  regrasIniciais: RegraConduta[]
  barbeiros: Barbeiro[]
  hojeStr: string
  ocorrencias: OcorrenciaView[]
  cicloNav: CicloNav
}

function fmtSinal(v: number) {
  const n = Number(v)
  return `${n > 0 ? '+' : ''}${n}`
}

function fmtData(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function ComportamentoClient({ ativoInicial, regrasIniciais, barbeiros, hojeStr, ocorrencias, cicloNav }: Props) {
  const [ativo, setAtivo] = useState(ativoInicial)
  const [regras, setRegras] = useState<RegraConduta[]>(regrasIniciais)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Painel: filtro por barbeiro (client-side). A lista vem do server (props) e
  // é reatualizada via revalidatePath ao registrar/excluir. `removidos` dá o
  // feedback otimista da exclusão enquanto o refresh não chega.
  const [filtroBarbeiro, setFiltroBarbeiro] = useState<string>('todos')
  const [removidos, setRemovidos] = useState<Set<string>>(() => new Set<string>())
  const ocVisiveis = useMemo(() => ocorrencias.filter(o => !removidos.has(o.id)), [ocorrencias, removidos])

  // Saldo do período por barbeiro (informativo — pro dono decidir bônus na mão).
  const saldos = useMemo(() => {
    const map = new Map<string, { nome: string; saldo: number; qtd: number }>()
    for (const o of ocVisiveis) {
      const cur = map.get(o.barbeiro_id) ?? { nome: o.barbeiroNome, saldo: 0, qtd: 0 }
      cur.saldo += o.valor; cur.qtd += 1
      map.set(o.barbeiro_id, cur)
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.saldo - a.saldo)
  }, [ocVisiveis])

  const ocFiltradas = filtroBarbeiro === 'todos' ? ocVisiveis : ocVisiveis.filter(o => o.barbeiro_id === filtroBarbeiro)

  function handleExcluirOcorrencia(id: string) {
    if (!confirm('Excluir esta ocorrência do histórico?')) return
    setRemovidos(prev => new Set(prev).add(id))
    startTransition(async () => { await excluirOcorrencia(id) })
  }

  // Form nova regra
  const [novoNome, setNovoNome] = useState('')
  const [novoValor, setNovoValor] = useState('')
  // Edição inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState('')

  // Registrar ocorrência
  const [ocBarbeiro, setOcBarbeiro] = useState('')
  const [ocRegra, setOcRegra] = useState('')        // id da regra ou 'avulso'
  const [ocData, setOcData] = useState(hojeStr)
  const [ocDescricao, setOcDescricao] = useState('')
  const [ocValor, setOcValor] = useState('')
  const [ocSucesso, setOcSucesso] = useState(false)
  const regrasAtivas = regras.filter(r => r.ativo)

  function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null); setOcSucesso(false)
    const fd = new FormData()
    fd.set('barbeiro_id', ocBarbeiro)
    fd.set('regra_id', ocRegra)
    fd.set('data', ocData)
    if (ocRegra === 'avulso') { fd.set('descricao', ocDescricao); fd.set('valor', ocValor || '0') }
    startTransition(async () => {
      const r = await registrarOcorrencia(fd)
      if (r?.error) { setErro(r.error); return }
      setOcSucesso(true)
      setOcRegra(''); setOcDescricao(''); setOcValor('')
    })
  }

  function handleToggle() {
    const novo = !ativo
    setAtivo(novo)
    startTransition(async () => {
      const r = await toggleComportamento(novo)
      if (r?.error) { setErro(r.error); setAtivo(!novo) }
    })
  }

  function handleCriarRegra(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData()
    fd.set('nome', novoNome)
    fd.set('valor', novoValor || '0')
    startTransition(async () => {
      const r = await criarRegra(fd)
      if (r?.error) { setErro(r.error); return }
      // Recarrega via revalidate; espelha localmente pra resposta imediata.
      setRegras(prev => [...prev, {
        id: `tmp-${prev.length}-${novoNome}`, barbearia_id: '', nome: novoNome.trim().slice(0, 80),
        valor: parseFloat((novoValor || '0').replace(',', '.')) || 0, ativo: true, created_at: '',
      }])
      setNovoNome(''); setNovoValor('')
    })
  }

  function startEdit(r: RegraConduta) {
    setEditId(r.id); setEditNome(r.nome); setEditValor(String(r.valor))
  }

  function handleSalvarEdit(id: string) {
    setErro(null)
    const fd = new FormData()
    fd.set('id', id); fd.set('nome', editNome); fd.set('valor', editValor || '0')
    startTransition(async () => {
      const r = await atualizarRegra(fd)
      if (r?.error) { setErro(r.error); return }
      setRegras(prev => prev.map(x => x.id === id
        ? { ...x, nome: editNome.trim().slice(0, 80), valor: parseFloat((editValor || '0').replace(',', '.')) || 0 }
        : x))
      setEditId(null)
    })
  }

  function handleToggleAtiva(r: RegraConduta) {
    setRegras(prev => prev.map(x => x.id === r.id ? { ...x, ativo: !r.ativo } : x))
    startTransition(async () => { await toggleRegraAtiva(r.id, !r.ativo) })
  }

  function handleExcluir(id: string) {
    if (!confirm('Excluir esta regra? As ocorrências já registradas continuam no histórico.')) return
    setRegras(prev => prev.filter(x => x.id !== id))
    startTransition(async () => { await excluirRegra(id) })
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-text">Metas de comportamento</h1>
        <p className="text-text-muted text-sm font-sans mt-0.5 leading-relaxed">
          Trilha <span className="text-text">privada</span> de conduta — só você vê.
          Não soma nem subtrai na pontuação de vendas, nas metas nem no ranking.
          O barbeiro não enxerga nada disso.
        </p>
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

      {/* Toggle geral */}
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={handleToggle}
        disabled={isPending}
        className={[
          'flex items-center gap-3 w-full p-4 rounded-xl border cursor-pointer transition-all text-left',
          ativo ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40',
        ].join(' ')}
      >
        <span className={['relative w-10 h-6 rounded-full transition-colors shrink-0', ativo ? 'bg-primary' : 'bg-surface'].join(' ')}>
          <span className={['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', ativo ? 'translate-x-4' : 'translate-x-0'].join(' ')} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans font-semibold text-text leading-snug">
            {ativo ? 'Metas de comportamento ativadas' : 'Ativar metas de comportamento'}
          </p>
          <p className="text-xs font-sans text-text-muted leading-relaxed mt-0.5">
            {ativo
              ? 'Você pode cadastrar regras e registrar ocorrências de conduta.'
              : 'Desligado — nada de conduta aparece pra você nem pros barbeiros.'}
          </p>
        </div>
      </button>

      {ativo && (
        <>
          {/* ── Regras de conduta ── */}
          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-lg text-text">Regras de conduta</h2>
              <p className="text-text-muted text-xs font-sans leading-relaxed">
                Ex: “Chegou no horário” <span className="text-green-500">+10</span>,
                “Faltou sem avisar” <span className="text-red-400">−20</span>. Valor com sinal.
              </p>
            </div>

            <div className="space-y-2">
              {regras.length === 0 && (
                <p className="text-text-muted text-sm font-sans py-2">Nenhuma regra cadastrada ainda.</p>
              )}
              {regras.map(r => (
                <div key={r.id} className={['flex items-center gap-3 p-3 rounded-xl border', r.ativo ? 'bg-surface-2 border-border' : 'bg-surface-2/40 border-border/50 opacity-60'].join(' ')}>
                  {editId === r.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input value={editNome} onChange={e => setEditNome(e.target.value)} className="input flex-1 text-sm" />
                      <input value={editValor} onChange={e => setEditValor(e.target.value)} type="number" step="any" className="input w-20 text-sm text-center" />
                      <button onClick={() => handleSalvarEdit(r.id)} disabled={isPending} className="btn-primary text-xs py-1.5 px-3">Salvar</button>
                      <button onClick={() => setEditId(null)} className="btn-ghost text-xs py-1.5 px-2">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-text truncate">{r.nome}</p>
                      </div>
                      <span className={['font-serif text-lg tabular-nums shrink-0', Number(r.valor) < 0 ? 'text-red-400' : 'text-green-500'].join(' ')}>
                        {fmtSinal(r.valor)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(r)} disabled={isPending} title="Editar"
                          className="text-xs text-text-muted hover:text-text px-2 py-1.5 rounded-lg hover:bg-surface transition-colors">✏️</button>
                        <button onClick={() => handleToggleAtiva(r)} disabled={isPending}
                          className="text-xs text-text-muted hover:text-text px-2 py-1.5 rounded-lg hover:bg-surface transition-colors">
                          {r.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleExcluir(r.id)} disabled={isPending} title="Excluir"
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-surface transition-colors">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Nova regra */}
            <form onSubmit={handleCriarRegra} className="flex items-end gap-2 p-3 rounded-xl border border-dashed border-border">
              <div className="flex-1">
                <label className="label">Nome da regra</label>
                <input value={novoNome} onChange={e => setNovoNome(e.target.value)} required maxLength={80}
                  placeholder="Ex: Chegou no horário" className="input text-sm" />
              </div>
              <div className="w-24">
                <label className="label">Valor</label>
                <input value={novoValor} onChange={e => setNovoValor(e.target.value)} type="number" step="any"
                  placeholder="+10" className="input text-sm text-center" />
              </div>
              <button type="submit" disabled={isPending} className="btn-primary text-sm shrink-0">Adicionar</button>
            </form>
          </section>

          {/* ── Registrar ocorrência ── */}
          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-lg text-text">Registrar ocorrência</h2>
              <p className="text-text-muted text-xs font-sans leading-relaxed">
                Escolha um barbeiro e uma regra — ou lance um ajuste avulso. Fica só no histórico de conduta dele.
              </p>
            </div>

            <form onSubmit={handleRegistrar} className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Barbeiro</label>
                  <select value={ocBarbeiro} onChange={e => setOcBarbeiro(e.target.value)} required className="input text-sm">
                    <option value="">Selecione…</option>
                    {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Data</label>
                  <input type="date" value={ocData} onChange={e => setOcData(e.target.value)} required className="input text-sm" />
                </div>
              </div>

              <div>
                <label className="label">Regra</label>
                <select value={ocRegra} onChange={e => { setOcRegra(e.target.value); setOcSucesso(false) }} required className="input text-sm">
                  <option value="">Selecione…</option>
                  {regrasAtivas.map(r => (
                    <option key={r.id} value={r.id}>{r.nome} ({fmtSinal(r.valor)})</option>
                  ))}
                  <option value="avulso">✎ Ajuste avulso…</option>
                </select>
              </div>

              {ocRegra === 'avulso' && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="label">Descrição do ajuste</label>
                    <input value={ocDescricao} onChange={e => setOcDescricao(e.target.value)} maxLength={120}
                      placeholder="Ex: Ajudou a limpar a loja" className="input text-sm" />
                  </div>
                  <div className="sm:w-24">
                    <label className="label">Valor</label>
                    <input value={ocValor} onChange={e => setOcValor(e.target.value)} type="number" step="any"
                      placeholder="+5 / -5" className="input text-sm text-center" />
                  </div>
                </div>
              )}

              {ocSucesso && <p className="text-green-500 text-sm font-sans">✅ Ocorrência registrada.</p>}

              <button type="submit" disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Registrando…' : 'Registrar'}
              </button>
            </form>
          </section>

          {/* ── Painel privado de conduta ── */}
          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-lg text-text">Histórico de conduta</h2>
              <p className="text-text-muted text-xs font-sans leading-relaxed">
                Saldo do período (só informativo). Nada disso vai pra pontuação, meta ou ranking.
              </p>
            </div>

            <MonthNavigator
              mesSel={cicloNav.mes}
              anoSel={cicloNav.ano}
              mesAtual={cicloNav.mesAtual}
              anoAtual={cicloNav.anoAtual}
              diaFechamento={cicloNav.diaFechamento}
              podeVoltar={cicloNav.podeVoltar}
              podeAvancar={cicloNav.podeAvancar}
              hrefBase="/dashboard/comportamento"
            />

            {/* Saldo por barbeiro */}
            {saldos.length === 0 ? (
              <p className="text-text-muted text-sm font-sans py-2">Nenhuma ocorrência neste período.</p>
            ) : (
              <div className="space-y-2">
                {saldos.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFiltroBarbeiro(f => f === s.id ? 'todos' : s.id)}
                    className={['w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                      filtroBarbeiro === s.id ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40'].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-text truncate">{s.nome}</p>
                      <p className="text-xs font-sans text-text-muted">{s.qtd} ocorrência{s.qtd !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={['font-serif text-xl tabular-nums shrink-0', s.saldo < 0 ? 'text-red-400' : s.saldo > 0 ? 'text-green-500' : 'text-text-muted'].join(' ')}>
                      {fmtSinal(s.saldo)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Lista de ocorrências (filtrada por barbeiro selecionado) */}
            {ocVisiveis.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-muted text-xs font-sans uppercase tracking-wide">
                    Ocorrências {filtroBarbeiro !== 'todos' && `— ${saldos.find(s => s.id === filtroBarbeiro)?.nome ?? ''}`}
                  </p>
                  {filtroBarbeiro !== 'todos' && (
                    <button onClick={() => setFiltroBarbeiro('todos')} className="text-xs text-text-muted hover:text-text font-sans">Ver todos</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {ocFiltradas.map(o => (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border">
                      <span className="text-xs font-sans text-text-muted tabular-nums w-10 shrink-0">{fmtData(o.data)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-text truncate">{o.descricao ?? '—'}</p>
                        {filtroBarbeiro === 'todos' && <p className="text-xs font-sans text-text-muted truncate">{o.barbeiroNome}</p>}
                      </div>
                      <span className={['font-serif text-base tabular-nums shrink-0', o.valor < 0 ? 'text-red-400' : 'text-green-500'].join(' ')}>
                        {fmtSinal(o.valor)}
                      </span>
                      <button onClick={() => handleExcluirOcorrencia(o.id)} disabled={isPending}
                        title="Excluir" className="text-xs text-text-muted hover:text-red-400 px-1.5 py-1 rounded transition-colors shrink-0">🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
