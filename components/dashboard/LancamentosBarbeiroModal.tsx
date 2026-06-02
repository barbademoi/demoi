'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  buscarLancamentosBarbeiro30Dias,
  excluirLancamentoDia,
  lancarDiaComoDono,
  type LancamentoDia,
} from '@/app/dashboard/lancamentos-barbeiro/actions'
import { dataLocalStr } from '@/lib/utils'
import DiaEditForm, { type ServicoCampanha } from './DiaEditForm'

interface Props {
  barbeiroId: string
  barbeiroNome: string
  onClose: () => void
}

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

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

export default function LancamentosBarbeiroModal({ barbeiroId, barbeiroNome, onClose }: Props) {
  const [dias, setDias] = useState<LancamentoDia[] | null>(null)
  const [servicosCampanha, setServicosCampanha] = useState<ServicoCampanha[]>([])
  const [campanhaAtiva, setCampanhaAtiva] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [excluindoData, setExcluindoData] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 'lista' = visualização padrão; string ISO = editando o dia X; 'novo' = adicionando novo lançamento
  const [view, setView] = useState<'lista' | 'novo' | string>('lista')

  // Estado inicial do form (data + valores) — só lido pelo DiaEditForm na abertura.
  const [formDataInicial, setFormDataInicial] = useState<string>(dataLocalStr())
  const [formValoresIniciais, setFormValoresIniciais] = useState<Record<string, string>>({})

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
    setFormDataInicial(dataLocalStr())
    setFormValoresIniciais({})
    setErro(null)
    setView('novo')
  }

  function abrirFormEdita(data: string) {
    setFormDataInicial(data)
    const dia = dias?.find(d => d.data === data)
    const valores: Record<string, string> = {}
    if (dia) {
      for (const s of dia.servicos) {
        valores[s.servico_id] = String(s.quantidade)
      }
    }
    setFormValoresIniciais(valores)
    setErro(null)
    setView(data)
  }

  function voltarParaLista() {
    setView('lista')
    setErro(null)
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

  async function handleSalvarFormDia(
    data: string,
    servicos: { servico_id: string; quantidade: number }[],
  ) {
    const res = await lancarDiaComoDono({ barbeiroId, data, servicos })
    if (res?.error) return { error: res.error }
    await recarregar()
    return { ok: true as const }
  }

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
            <DiaEditForm
              mode={view === 'novo' ? 'novo' : 'editar'}
              dataInicial={formDataInicial}
              valoresIniciais={formValoresIniciais}
              servicosCampanha={servicosCampanha}
              onSalvar={handleSalvarFormDia}
              onCancelar={voltarParaLista}
            />
          )}
        </div>
      </div>
    </div>
  )
}
