'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  buscarLancamentosBarbeiro30Dias,
  excluirLancamentoDia,
  lancarDiaComoDono,
  type LancamentoDia,
} from '@/app/dashboard/lancamentos-barbeiro/actions'

interface Props {
  barbeiroId: string
  barbeiroNome: string
  onClose: () => void
}

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function pad2(n: number): string { return String(n).padStart(2, '0') }

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDataLabel(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dia = new Date(a, m - 1, d)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)

  if (dia.toDateString() === hoje.toDateString()) return `Hoje · ${d}/${meses[m - 1]}`
  if (dia.toDateString() === ontem.toDateString()) return `Ontem · ${d}/${meses[m - 1]}`
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  return `${dias[dia.getDay()]}, ${d}/${meses[m - 1]}`
}

type ServicoAtual = { id: string; nome: string; pontos: number }

export default function LancamentosBarbeiroModal({ barbeiroId, barbeiroNome, onClose }: Props) {
  const [dias, setDias] = useState<LancamentoDia[] | null>(null)
  const [servicosCampanha, setServicosCampanha] = useState<ServicoAtual[]>([])
  const [campanhaAtiva, setCampanhaAtiva] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [excluindoData, setExcluindoData] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 'lista' = visualização padrão; string ISO = editando o dia X; 'novo' = adicionando novo lançamento
  const [view, setView] = useState<'lista' | 'novo' | string>('lista')

  // Estado do form (data + valores por serviço)
  const [formData, setFormData] = useState<string>(todayIso())
  const [formValores, setFormValores] = useState<Record<string, string>>({})
  const [formSucesso, setFormSucesso] = useState(false)

  async function recarregar() {
    setErro(null)
    const res = await buscarLancamentosBarbeiro30Dias(barbeiroId)
    if ('error' in res) { setErro(res.error ?? 'Erro desconhecido'); return }
    setDias(res.dias)
    setServicosCampanha(res.servicosCampanhaAtual)
    setCampanhaAtiva(res.campanhaAtualAtiva)
  }

  useEffect(() => {
    recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirFormNovo() {
    setView('novo')
    setFormData(todayIso())
    setFormValores({})
    setErro(null)
    setFormSucesso(false)
  }

  function abrirFormEdita(data: string) {
    setView(data)
    setFormData(data)
    const dia = dias?.find(d => d.data === data)
    const valores: Record<string, string> = {}
    if (dia) {
      for (const s of dia.servicos) {
        valores[s.servico_id] = String(s.quantidade)
      }
    }
    setFormValores(valores)
    setErro(null)
    setFormSucesso(false)
  }

  function voltarParaLista() {
    setView('lista')
    setErro(null)
    setFormSucesso(false)
  }

  function handleExcluirDia(data: string) {
    if (!confirm('Apagar todos os lançamentos desse dia?')) return
    setExcluindoData(data)
    startTransition(async () => {
      const res = await excluirLancamentoDia(barbeiroId, data)
      setExcluindoData(null)
      if (res?.error) { setErro(res.error); return }
      await recarregar()
    })
  }

  function handleSalvarForm() {
    setErro(null)
    setFormSucesso(false)
    // Inclui TODOS os serviços da campanha — quantidade 0 dispara DELETE
    // (necessário pra remover serviços que estavam no dia mas foram zerados).
    const servicos = servicosCampanha.map(s => ({
      servico_id: s.id,
      quantidade: parseInt(formValores[s.id] || '0', 10) || 0,
    }))
    startTransition(async () => {
      const res = await lancarDiaComoDono({ barbeiroId, data: formData, servicos })
      if (res?.error) { setErro(res.error); return }
      setFormSucesso(true)
      await recarregar()
      setTimeout(() => {
        setFormSucesso(false)
        voltarParaLista()
      }, 1000)
    })
  }

  // Preview do total de pontos enquanto digita
  const totalPreview = servicosCampanha.reduce((s, sv) => {
    const qtd = parseInt(formValores[sv.id] || '0', 10) || 0
    return s + qtd * sv.pontos
  }, 0)

  const headerTitulo = view === 'lista'
    ? 'Lançamentos'
    : view === 'novo'
      ? 'Novo lançamento'
      : 'Editar lançamento'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {view !== 'lista' && (
              <button
                onClick={voltarParaLista}
                className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-2 shrink-0"
                aria-label="Voltar"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-text-muted text-xs font-sans uppercase tracking-wide">{headerTitulo}</p>
              <h2 className="font-serif text-xl text-text truncate">{barbeiroNome}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* ── LISTA ───────────────────────────────────────── */}
          {view === 'lista' && (
            <>
              {dias === null && !erro && (
                <p className="text-text-muted text-sm font-sans text-center py-8">Carregando…</p>
              )}

              {erro && <p className="text-red-400 text-sm font-sans py-2">{erro}</p>}

              {dias && dias.length === 0 && (
                <p className="text-text-muted text-sm font-sans text-center py-6">
                  Nenhum lançamento nos últimos 30 dias.
                </p>
              )}

              {dias && dias.length > 0 && (
                <div className="space-y-3">
                  {dias.map(dia => {
                    const editadoPeloDono = dia.servicos.some(s => s.editado_por === 'dono' || s.lancado_por === 'dono')
                    const excluindo = excluindoData === dia.data
                    return (
                      <div key={dia.data} className="rounded-xl border border-border bg-surface-2 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-text text-sm font-sans font-semibold capitalize">
                            {formatDataLabel(dia.data)}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {editadoPeloDono && (
                              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                ✏️ dono
                              </span>
                            )}
                            <button
                              onClick={() => abrirFormEdita(dia.data)}
                              aria-label="Editar este dia"
                              className="text-text-muted hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleExcluirDia(dia.data)}
                              disabled={excluindo}
                              aria-label="Apagar todos os lançamentos deste dia"
                              className="text-text-muted hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {excluindo ? (
                                <span className="text-xs">…</span>
                              ) : (
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <ul className="space-y-1 mb-2">
                          {dia.servicos.map(s => (
                            <li key={s.servico_id} className="flex items-center justify-between text-xs font-sans">
                              <span className="text-text">
                                <span className="text-text-muted">×{s.quantidade}</span> {s.servico_nome}
                              </span>
                              <span className="text-text-muted tabular-nums">{s.pontos_total} pts</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Total</p>
                          <p className="text-primary font-serif text-base font-semibold">{dia.totalPontos} pts</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={abrirFormNovo}
                disabled={!campanhaAtiva || servicosCampanha.length === 0}
                className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 text-sm font-sans font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={!campanhaAtiva ? 'Sem campanha ativa neste mês' : undefined}
              >
                + Adicionar lançamento manual
              </button>
              {!campanhaAtiva && (
                <p className="text-text-muted text-[11px] font-sans text-center mt-2 italic">
                  Sem campanha ativa neste mês — configure no dashboard primeiro.
                </p>
              )}
            </>
          )}

          {/* ── FORM (novo ou editar) ───────────────────────── */}
          {view !== 'lista' && (
            <div className="space-y-4">
              {/* Data */}
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  value={formData}
                  onChange={e => setFormData(e.target.value)}
                  max={todayIso()}
                  className="input w-full"
                  disabled={view !== 'novo'}
                  // Quando editando, a data é fixa (não dá pra "mover" um lançamento de dia)
                />
                {view !== 'novo' && (
                  <p className="text-text-muted text-[11px] font-sans mt-1">
                    Pra mudar de dia, apague esse e crie um novo.
                  </p>
                )}
              </div>

              {/* Serviços da campanha */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label !mb-0">Serviços</label>
                  <p className="text-text-muted text-xs font-sans">
                    Total: <span className="text-primary font-semibold tabular-nums">{totalPreview} pts</span>
                  </p>
                </div>
                {servicosCampanha.length === 0 ? (
                  <p className="text-text-muted text-sm font-sans italic">
                    Sem serviços configurados na campanha deste mês.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {servicosCampanha.map(s => {
                      const qtd = parseInt(formValores[s.id] || '0', 10) || 0
                      const subtotal = qtd * s.pontos
                      return (
                        <div key={s.id} className="bg-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-sm text-text truncate">{s.nome}</p>
                            <p className="text-text-muted text-[11px] font-sans">{s.pontos} pts/un</p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={formValores[s.id] ?? ''}
                            onChange={e => setFormValores(v => ({ ...v, [s.id]: e.target.value }))}
                            className="input w-16 py-1.5 text-sm text-center"
                          />
                          <span className="text-text-muted text-xs font-sans tabular-nums w-14 text-right shrink-0">
                            {subtotal} pts
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

              {/* Footer do form */}
              <div className="flex gap-2 pt-2">
                <button onClick={voltarParaLista} className="btn-ghost flex-1 text-sm py-2.5" disabled={isPending}>
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarForm}
                  disabled={isPending || servicosCampanha.length === 0}
                  className="btn-primary flex-1 text-sm py-2.5"
                >
                  {formSucesso ? '✓ Salvo!' : isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>

              <p className="text-text-muted text-[11px] font-sans italic text-center">
                Lançamento ficará marcado como &ldquo;✏️ dono&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
