'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  buscarLancamentosBarbeiroIntervalo,
  excluirLancamentoDia,
  lancarDiaComoDono,
  type LancamentoDia,
} from '@/app/dashboard/lancamentos-barbeiro/actions'
import { dataLocalStr } from '@/lib/utils'
import DiaEditForm, { type ServicoCampanha } from '@/components/dashboard/DiaEditForm'

interface BarbeiroLite { id: string; nome: string; foto_url: string | null; tipo: 'barbeiro' | 'recepcionista' | string; ativo: boolean }

interface Props {
  barbeiros: BarbeiroLite[]
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
  return `${dias[dia.getDay()]}, ${d}/${meses[m - 1]}/${a}`
}

function haNDiasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dataLocalStr(d)
}

export default function HistoricoClient({ barbeiros }: Props) {
  // Defaults: últimos 30 dias, primeiro barbeiro ativo.
  const [barbeiroId, setBarbeiroId] = useState<string>(barbeiros[0]?.id ?? '')
  const [dataInicio, setDataInicio] = useState<string>(haNDiasAtras(30))
  const [dataFim, setDataFim] = useState<string>(dataLocalStr())

  const [dias, setDias] = useState<LancamentoDia[] | null>(null)
  const [totalPeriodo, setTotalPeriodo] = useState<number>(0)
  const [servicosCampanha, setServicosCampanha] = useState<ServicoCampanha[]>([])
  const [campanhaAtiva, setCampanhaAtiva] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  // 'lista' = visualização; 'novo' = adicionando; YYYY-MM-DD = editando esse dia
  const [view, setView] = useState<'lista' | 'novo' | string>('lista')
  const [formDataInicial, setFormDataInicial] = useState<string>(dataLocalStr())
  const [formValoresIniciais, setFormValoresIniciais] = useState<Record<string, string>>({})

  const [excluindoData, setExcluindoData] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const barbeiroNome = useMemo(
    () => barbeiros.find(b => b.id === barbeiroId)?.nome ?? '',
    [barbeiros, barbeiroId],
  )

  async function recarregar() {
    if (!barbeiroId) return
    setErro(null)
    setCarregando(true)
    const res = await buscarLancamentosBarbeiroIntervalo(barbeiroId, dataInicio, dataFim)
    setCarregando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro desconhecido'); setDias([]); return }
    setDias(res.dias)
    setTotalPeriodo(res.totalPontosPeriodo)
    setServicosCampanha(res.servicosCampanhaAtual)
    setCampanhaAtiva(res.campanhaAtualAtiva)
  }

  useEffect(() => {
    recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiroId, dataInicio, dataFim])

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
    if (dia) for (const s of dia.servicos) valores[s.servico_id] = String(s.quantidade)
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

  // Reusa lancarDiaComoDono — mantém o `data` original (sem regravar com now()).
  async function handleSalvarFormDia(
    data: string,
    servicos: { servico_id: string; quantidade: number }[],
  ) {
    const res = await lancarDiaComoDono({ barbeiroId, data, servicos })
    if (res?.error) return { error: res.error }
    await recarregar()
    return { ok: true as const }
  }

  if (barbeiros.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted font-sans text-sm">
          Nenhum barbeiro ativo na barbearia.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="barbeiro" className="label">Barbeiro</label>
          <select
            id="barbeiro"
            value={barbeiroId}
            onChange={e => { setBarbeiroId(e.target.value); setView('lista') }}
            className="input w-full"
          >
            {barbeiros.map(b => (
              <option key={b.id} value={b.id}>
                {b.nome}{b.tipo === 'recepcionista' ? ' (recepção)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="inicio" className="label">De</label>
            <input
              id="inicio"
              type="date"
              value={dataInicio}
              onChange={e => { setDataInicio(e.target.value); setView('lista') }}
              max={dataFim}
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="fim" className="label">Até</label>
            <input
              id="fim"
              type="date"
              value={dataFim}
              onChange={e => { setDataFim(e.target.value); setView('lista') }}
              min={dataInicio}
              max={dataLocalStr()}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo: lista de dias ou form */}
      {view === 'lista' && (
        <>
          {/* Total do período */}
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Total no período</p>
              <p className="font-serif text-2xl text-text mt-1">{totalPeriodo} <span className="text-base text-text-muted">pts</span></p>
            </div>
            <button
              onClick={abrirFormNovo}
              disabled={!campanhaAtiva || servicosCampanha.length === 0}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!campanhaAtiva ? 'Sem campanha ativa no ciclo atual' : undefined}
            >
              + Adicionar lançamento
            </button>
          </div>
          {!campanhaAtiva && (
            <p className="text-text-muted text-xs font-sans italic text-center -mt-3">
              Sem campanha ativa no ciclo atual — configure no dashboard primeiro.
            </p>
          )}

          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

          {/* Dias */}
          {carregando && <p className="text-text-muted text-sm font-sans text-center py-6">Carregando…</p>}
          {!carregando && dias && dias.length === 0 && (
            <p className="text-text-muted text-sm font-sans text-center py-8">
              Nenhum lançamento nesse intervalo para <span className="text-text font-semibold">{barbeiroNome}</span>.
            </p>
          )}
          {!carregando && dias && dias.length > 0 && (
            <div className="space-y-3">
              {dias.map(dia => {
                const editadoPeloDono = dia.servicos.some(s => s.editado_por === 'dono' || s.lancado_por === 'dono')
                const excluindo = excluindoData === dia.data
                return (
                  <div key={dia.data} className="card p-4">
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
                        <li key={s.servico_id} className="flex items-center justify-between text-xs sm:text-sm font-sans">
                          <span className="text-text">
                            <span className="text-text-muted">{s.quantidade}× </span>{s.servico_nome}
                          </span>
                          <span className="text-text-muted tabular-nums">{s.pontos_total} pts</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Total do dia</p>
                      <p className="text-primary font-serif text-base font-semibold">{dia.totalPontos} pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {view !== 'lista' && (
        <div className="card p-4 sm:p-5">
          <h2 className="font-serif text-lg text-text mb-4">
            {view === 'novo' ? 'Novo lançamento' : 'Editar lançamento'}
            <span className="text-text-muted text-sm font-sans ml-2">— {barbeiroNome}</span>
          </h2>
          <DiaEditForm
            mode={view === 'novo' ? 'novo' : 'editar'}
            dataInicial={formDataInicial}
            valoresIniciais={formValoresIniciais}
            servicosCampanha={servicosCampanha}
            onSalvar={handleSalvarFormDia}
            onCancelar={voltarParaLista}
          />
        </div>
      )}
    </div>
  )
}
