'use client'

import { useState, useTransition } from 'react'
import { salvarMetas, buscarMetasPeriodo, buscarMetasMaisRecenteAntes } from '@/app/dashboard/metas/actions'
import { cicloDeData } from '@/lib/ciclo'
import { formatBRL } from '@/lib/utils'
import type { Barbeiro, MetaIndividual } from '@/types/database'

interface MetaBarbeiro {
  id: string
  nome: string
  bronze_comm: string
  prata_comm: string
  ouro_comm: string
  bronze_premio: string
  prata_premio: string
  ouro_premio: string
}

interface Props {
  barbeiros: Barbeiro[]
  metasAtuais?: MetaIndividual[]
  metaColetiva?: number
  faturamentoAcumulado?: number
  premioColetivo?: string
  mes: number
  ano: number
  herdadoDeMesAnterior?: boolean
  diaFechamento?: number
}

function mapMetasParaBarbeiros(barbeiros: Barbeiro[], inds?: MetaIndividual[]): MetaBarbeiro[] {
  return barbeiros.map(b => {
    const m = inds?.find(mi => mi.barbeiro_id === b.id)
    return {
      id: b.id,
      nome: b.nome,
      bronze_comm: m?.bronze_comm ? String(m.bronze_comm) : '',
      prata_comm: m?.prata_comm ? String(m.prata_comm) : '',
      ouro_comm: m?.ouro_comm ? String(m.ouro_comm) : '',
      bronze_premio: m?.bronze_premio ?? '',
      prata_premio: m?.prata_premio ?? '',
      ouro_premio: m?.ouro_premio ?? '',
    }
  })
}

export default function MetasModal({ barbeiros, metasAtuais, metaColetiva, faturamentoAcumulado, premioColetivo, mes, ano, herdadoDeMesAnterior, diaFechamento = 1 }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [msgSucesso, setMsgSucesso] = useState('✓ Metas salvas')

  // ── Período selecionado (navegação entre meses/ciclos) ──
  const [mesSel, setMesSel] = useState(mes)
  const [anoSel, setAnoSel] = useState(ano)
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(false)
  // Período em foco existe no banco? (controla aviso "sem metas")
  const [periodoExiste, setPeriodoExiste] = useState(true)
  // Quando o período não tem metas, oferece copiar do mais recente anterior.
  const [metasAnt, setMetasAnt] = useState<{
    mesOrigem: number
    anoOrigem: number
    metaColetiva: number
    premioColetivo: string
    metasIndividuais: MetaIndividual[]
  } | null>(null)
  const [mostrarConfirmCopia, setMostrarConfirmCopia] = useState(false)
  // É o período atual (= não dá pra voltar antes dele)
  const ehPeriodoAtual = mesSel === mes && anoSel === ano

  const periodoLabel = cicloDeData(new Date(anoSel, mesSel - 1, diaFechamento), diaFechamento).label

  const [metaColetivaVal, setMetaColetivaVal] = useState(String(metaColetiva ?? ''))
  const [faturamentoVal, setFaturamentoVal] = useState(String(faturamentoAcumulado ?? ''))
  const [premioVal, setPremioVal] = useState(premioColetivo ?? '')
  const [metas, setMetas] = useState<MetaBarbeiro[]>(() => mapMetasParaBarbeiros(barbeiros, metasAtuais))

  function updateMeta(id: string, field: keyof Omit<MetaBarbeiro, 'id' | 'nome'>, value: string) {
    setMetas(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  // Navega pra outro período e re-preenche os campos com o que já existe lá
  function navegarPeriodo(delta: number) {
    let m = mesSel + delta
    let a = anoSel
    if (m > 12) { m = 1; a += 1 }
    if (m < 1) { m = 12; a -= 1 }
    // Piso: não volta antes do período atual
    if (a < ano || (a === ano && m < mes)) return

    setMesSel(m)
    setAnoSel(a)
    setErro(null)
    setCarregandoPeriodo(true)
    startTransition(async () => {
      const res = await buscarMetasPeriodo(m, a)
      setCarregandoPeriodo(false)
      if ('error' in res) { setErro(res.error); return }
      setMetaColetivaVal(res.metaColetiva ? String(res.metaColetiva) : '')
      setFaturamentoVal(res.faturamentoAcumulado ? String(res.faturamentoAcumulado) : '')
      setPremioVal(res.premioColetivo)
      setMetas(mapMetasParaBarbeiros(barbeiros, res.metasIndividuais))
      setPeriodoExiste(res.existe)

      // Período sem metas → procura a mais recente anterior pra oferecer "Copiar".
      if (!res.existe) {
        const ant = await buscarMetasMaisRecenteAntes(m, a)
        if ('error' in ant) return
        setMetasAnt(ant.existe ? {
          mesOrigem: ant.mesOrigem,
          anoOrigem: ant.anoOrigem,
          metaColetiva: ant.metaColetiva,
          premioColetivo: ant.premioColetivo,
          metasIndividuais: ant.metasIndividuais,
        } : null)
      } else {
        setMetasAnt(null)
      }
    })
  }

  function aplicarCopia() {
    if (!metasAnt) return
    setMetaColetivaVal(metasAnt.metaColetiva ? String(metasAnt.metaColetiva) : '')
    setPremioVal(metasAnt.premioColetivo)
    setMetas(mapMetasParaBarbeiros(barbeiros, metasAnt.metasIndividuais))
    setMostrarConfirmCopia(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('mes', String(mesSel))
      fd.set('ano', String(anoSel))
      fd.set('meta_coletiva', metaColetivaVal)
      fd.set('premio_coletivo', premioVal)
      fd.set('faturamento_acumulado', faturamentoVal)
      fd.set('barbeiros', JSON.stringify(
        metas.map(m => ({
          id: m.id,
          bronze_comm: parseFloat(m.bronze_comm) || 0,
          prata_comm: parseFloat(m.prata_comm) || 0,
          ouro_comm: parseFloat(m.ouro_comm) || 0,
          bronze_premio: m.bronze_premio,
          prata_premio: m.prata_premio,
          ouro_premio: m.ouro_premio,
        }))
      ))
      const res = await salvarMetas(fd)
      if (res && 'error' in res) {
        setErro(res.error)
      } else {
        const salvos = res && 'salvos' in res ? (res as { salvos: number }).salvos : 0
        setSucesso(true)
        setMsgSucesso(`✓ Metas salvas (${salvos} barbeiro${salvos !== 1 ? 's' : ''})`)
        setOpen(false)
        setTimeout(() => setSucesso(false), 4000)
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm py-2 px-4 border border-border">
        {sucesso ? msgSucesso : 'Configurar metas'}
      </button>
    )
  }

  return (
    <>
    <div
      style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.7)', zIndex:50, overflowY:'scroll' }}
    >
      <div className="card p-6 w-full mx-auto my-8" style={{ maxWidth:'672px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-text">Configurar metas</h3>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text text-xl">×</button>
        </div>

        {/* Seletor de período (navega entre ciclos futuros) */}
        <div className="flex items-center justify-between gap-3 mb-6 p-2 rounded-xl bg-surface-2 border border-border">
          <button
            type="button"
            onClick={() => navegarPeriodo(-1)}
            disabled={ehPeriodoAtual || isPending}
            aria-label="Período anterior"
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="text-center">
            <p className="font-serif text-lg text-text capitalize leading-tight">{periodoLabel}</p>
            {!periodoExiste && !carregandoPeriodo && (
              <p className="text-amber-500 text-[11px] font-sans">Sem metas — configure abaixo</p>
            )}
            {ehPeriodoAtual && (
              <p className="text-text-muted text-[11px] font-sans">período atual</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navegarPeriodo(1)}
            disabled={isPending}
            aria-label="Próximo período"
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {!periodoExiste && !carregandoPeriodo && metasAnt && (
          <div className="mb-6 p-4 rounded-xl bg-surface-2 border border-border">
            <p className="font-sans text-sm text-text mb-3">
              <span className="capitalize font-semibold">{periodoLabel}</span> — sem metas configuradas
            </p>
            <button
              type="button"
              onClick={() => setMostrarConfirmCopia(true)}
              className="btn-ghost text-sm py-2 px-4 border border-border"
            >
              📋 Copiar metas de {cicloDeData(new Date(metasAnt.anoOrigem, metasAnt.mesOrigem - 1, diaFechamento), diaFechamento).label}
            </button>
            <p className="text-xs text-text-muted font-sans mt-2">ou configure do zero abaixo</p>
          </div>
        )}

        {herdadoDeMesAnterior && ehPeriodoAtual && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 text-sm font-sans flex items-start gap-3">
            <span aria-hidden className="text-base leading-none mt-0.5">💡</span>
            <p className="flex-1 text-text leading-relaxed">
              <span className="font-semibold">Tudo já preenchido!</span> Carregamos as metas
              do mês anterior pra você não precisar digitar tudo de novo. Ajuste o que
              precisar e clique em <span className="font-semibold">&ldquo;Salvar metas&rdquo;</span> pra
              confirmar pra <span className="capitalize font-semibold">{periodoLabel}</span>.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meta coletiva */}
          <div className="card p-4 space-y-3">
            <h4 className="font-sans font-semibold text-text text-sm">Meta coletiva</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Faturamento acumulado (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={faturamentoVal}
                  onChange={e => setFaturamentoVal(e.target.value)}
                  placeholder="0,00" className="input"
                />
              </div>
              <div>
                <label className="label">Meta do mês (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={metaColetivaVal}
                  onChange={e => setMetaColetivaVal(e.target.value)}
                  placeholder="60000" className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Prêmio coletivo</label>
              <input
                type="text"
                value={premioVal}
                onChange={e => setPremioVal(e.target.value)}
                placeholder="Ex: Rodízio de pizza" className="input"
              />
            </div>
          </div>

          {/* Metas individuais */}
          <div>
            <h4 className="font-sans font-semibold text-text text-sm mb-3">Metas individuais</h4>
            <div className="space-y-3">
              {metas.map(m => (
                <div key={m.id} className="card p-3 space-y-2">
                  <p className="font-sans font-semibold text-text text-sm">{m.nome}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label metal-text-bronze">Bronze (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.bronze_comm}
                        onChange={e => updateMeta(m.id, 'bronze_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label metal-text-silver">Prata (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.prata_comm}
                        onChange={e => updateMeta(m.id, 'prata_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label metal-text-gold">Ouro (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.ouro_comm}
                        onChange={e => updateMeta(m.id, 'ouro_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Prêmio Bronze</label>
                      <input
                        type="text"
                        value={m.bronze_premio}
                        onChange={e => updateMeta(m.id, 'bronze_premio', e.target.value)}
                        placeholder="Ex: R$200" className="input py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label">Prêmio Prata</label>
                      <input
                        type="text"
                        value={m.prata_premio}
                        onChange={e => updateMeta(m.id, 'prata_premio', e.target.value)}
                        placeholder="Ex: R$350" className="input py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label">Prêmio Ouro</label>
                      <input
                        type="text"
                        value={m.ouro_premio}
                        onChange={e => updateMeta(m.id, 'ouro_premio', e.target.value)}
                        placeholder="Ex: R$500" className="input py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Salvando…' : 'Salvar metas'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {mostrarConfirmCopia && metasAnt && (
      <div
        style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', zIndex:60, overflowY:'auto' }}
      >
        <div className="card p-6 w-full mx-auto my-8" style={{ maxWidth:'520px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl text-text">
              Copiar de <span className="capitalize">{cicloDeData(new Date(metasAnt.anoOrigem, metasAnt.mesOrigem - 1, diaFechamento), diaFechamento).label}</span>?
            </h3>
            <button type="button" onClick={() => setMostrarConfirmCopia(false)} className="text-text-muted hover:text-text text-xl">×</button>
          </div>

          <div className="space-y-2 mb-4 p-3 rounded-xl bg-surface-2 border border-border">
            <p className="text-sm font-sans text-text">
              <span className="text-text-muted">Meta coletiva:</span>{' '}
              <span className="font-semibold">{formatBRL(metasAnt.metaColetiva)}</span>
            </p>
            {metasAnt.premioColetivo && (
              <p className="text-sm font-sans text-text">
                <span className="text-text-muted">Prêmio:</span>{' '}
                <span className="font-semibold">{metasAnt.premioColetivo}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5 mb-5 max-h-72 overflow-y-auto">
            {barbeiros.map(b => {
              const mi = metasAnt.metasIndividuais.find(x => x.barbeiro_id === b.id)
              if (!mi) return null
              return (
                <p key={b.id} className="text-xs font-sans text-text">
                  <span className="font-semibold">{b.nome}</span>{' '}
                  <span className="text-text-muted">
                    BRZ {formatBRL(mi.bronze_comm)} · PRT {formatBRL(mi.prata_comm)} · OUR {formatBRL(mi.ouro_comm)}
                  </span>
                </p>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setMostrarConfirmCopia(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="button" onClick={aplicarCopia} className="btn-primary flex-1">
              ✓ Copiar e editar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
