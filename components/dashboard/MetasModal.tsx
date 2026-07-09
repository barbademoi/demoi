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

type ModoMetaOpt = 'faturamento' | 'comissao' | 'ambos'

// Base da meta (faturamento / comissão / os dois) — fica aqui, junto da
// definição dos valores de meta, porque é o que define a régua de meta/ranking.
const MODO_OPCOES: { value: ModoMetaOpt; titulo: string; descricao: string }[] = [
  {
    value: 'faturamento',
    titulo: 'Faturamento',
    descricao: 'Acompanhe o R$ que cada barbeiro faturou. Meta e ranking usam o faturamento.',
  },
  {
    value: 'comissao',
    titulo: 'Comissão',
    descricao: 'Acompanhe o R$ que cada barbeiro recebeu como comissão. Meta e ranking usam a comissão.',
  },
  {
    value: 'ambos',
    titulo: 'Os dois',
    descricao: 'Cada barbeiro lança faturamento E comissão. Você escolhe qual conta pra meta/ranking.',
  },
]

interface Props {
  barbeiros: Barbeiro[]
  metasAtuais?: MetaIndividual[]
  metaColetiva?: number
  metaColetivaBronze?: number
  metaColetivaPrata?: number
  faturamentoAcumulado?: number
  premioColetivo?: string
  premioColetivoBronze?: string
  premioColetivoPrata?: string
  modoMeta?: ModoMetaOpt
  baseMeta?: 'faturamento' | 'comissao'
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

export default function MetasModal({
  barbeiros, metasAtuais,
  metaColetiva, metaColetivaBronze, metaColetivaPrata,
  faturamentoAcumulado,
  premioColetivo, premioColetivoBronze, premioColetivoPrata,
  modoMeta = 'comissao', baseMeta = 'comissao',
  mes, ano, herdadoDeMesAnterior, diaFechamento = 1,
}: Props) {
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

  // Meta coletiva por tier (Bronze, Prata, Ouro). `metaColetivaVal` segue
  // sendo o tier Ouro (campo legado) — Bronze e Prata são novos.
  const [metaColetivaBronzeVal, setMetaColetivaBronzeVal] = useState(String(metaColetivaBronze ?? ''))
  const [metaColetivaPrataVal,  setMetaColetivaPrataVal]  = useState(String(metaColetivaPrata  ?? ''))
  const [metaColetivaVal,       setMetaColetivaVal]       = useState(String(metaColetiva       ?? ''))
  const [premioBronzeVal, setPremioBronzeVal] = useState(premioColetivoBronze ?? '')
  const [premioPrataVal,  setPremioPrataVal]  = useState(premioColetivoPrata  ?? '')
  const [premioVal,       setPremioVal]       = useState(premioColetivo       ?? '')
  const [faturamentoVal, setFaturamentoVal] = useState(String(faturamentoAcumulado ?? ''))
  const [metas, setMetas] = useState<MetaBarbeiro[]>(() => mapMetasParaBarbeiros(barbeiros, metasAtuais))

  // Base da meta (modo). Setting da barbearia (global, não por período) —
  // não se altera ao navegar entre ciclos; preserva o valor já salvo.
  const [modoSel, setModoSel] = useState<ModoMetaOpt>(modoMeta)
  const [baseSel, setBaseSel] = useState<'faturamento' | 'comissao'>(baseMeta)
  const modoMudou = modoSel !== modoMeta || (modoSel === 'ambos' && baseSel !== baseMeta)

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
      setMetaColetivaBronzeVal(res.metaColetivaBronze ? String(res.metaColetivaBronze) : '')
      setMetaColetivaPrataVal(res.metaColetivaPrata ? String(res.metaColetivaPrata) : '')
      setMetaColetivaVal(res.metaColetiva ? String(res.metaColetiva) : '')
      setPremioBronzeVal(res.premioColetivoBronze)
      setPremioPrataVal(res.premioColetivoPrata)
      setPremioVal(res.premioColetivo)
      setFaturamentoVal(res.faturamentoAcumulado ? String(res.faturamentoAcumulado) : '')
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
      fd.set('meta_coletiva_bronze', metaColetivaBronzeVal)
      fd.set('meta_coletiva_prata', metaColetivaPrataVal)
      fd.set('premio_coletivo', premioVal)
      fd.set('premio_coletivo_bronze', premioBronzeVal)
      fd.set('premio_coletivo_prata', premioPrataVal)
      fd.set('faturamento_acumulado', faturamentoVal)
      fd.set('modo_meta', modoSel)
      fd.set('base_meta', modoSel === 'ambos' ? baseSel : modoSel)
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
          {/* Base da meta (modo) — define a régua de meta/ranking */}
          <div className="card p-4 space-y-3">
            <div>
              <h4 className="font-sans font-semibold text-text text-sm">Sua meta é baseada em:</h4>
              <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
                Define a régua de meta e ranking. Os barbeiros lançam o(s) valor(es) na mão — o sistema não calcula nada.
              </p>
            </div>
            <div className="space-y-2">
              {MODO_OPCOES.map(op => (
                <label key={op.value} className={['flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                  modoSel === op.value ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40'].join(' ')}>
                  <input type="radio" name="modo_meta_radio" value={op.value} checked={modoSel === op.value}
                    onChange={() => setModoSel(op.value)} className="hidden" />
                  <div className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    modoSel === op.value ? 'border-primary' : 'border-border'].join(' ')}>
                    {modoSel === op.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-semibold text-text leading-snug">{op.titulo}</p>
                    <p className="text-xs font-sans text-text-muted leading-relaxed mt-0.5">{op.descricao}</p>
                  </div>
                </label>
              ))}
            </div>

            {modoSel === 'ambos' && (
              <div className="p-4 rounded-xl border border-border bg-surface-2">
                <p className="text-text text-xs font-sans font-semibold uppercase tracking-wide mb-1">
                  Meta e ranking contam por
                </p>
                <p className="text-text-muted text-xs font-sans mb-3 leading-relaxed">
                  Os dois valores ficam registrados, mas só um define meta/ranking. O outro fica de informação.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['faturamento', 'comissao'] as const).map(op => (
                    <label key={op} className={['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      baseSel === op ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary/40'].join(' ')}>
                      <input type="radio" name="base_meta_radio" value={op} checked={baseSel === op}
                        onChange={() => setBaseSel(op)} className="hidden" />
                      <div className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        baseSel === op ? 'border-primary' : 'border-border'].join(' ')}>
                        {baseSel === op && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-sans text-text">{op === 'faturamento' ? 'Faturamento' : 'Comissão'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {modoMudou && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10">
                <p className="text-amber-200 text-xs font-sans leading-relaxed">
                  ⚠️ Isso muda como suas metas e ranking são calculados. Não apaga nem altera lançamentos antigos — só vale daqui pra frente.
                </p>
              </div>
            )}
          </div>

          {/* Meta coletiva (Bronze / Prata / Ouro) */}
          <div className="card p-4 space-y-3">
            <h4 className="font-sans font-semibold text-text text-sm">Meta coletiva</h4>

            <div>
              <label className="label">Faturamento acumulado (R$)</label>
              <input
                type="number" step="0.01" min="0"
                value={faturamentoVal}
                onChange={e => setFaturamentoVal(e.target.value)}
                placeholder="0,00" className="input"
              />
              <p className="text-text-muted text-[11px] font-sans mt-1">
                Quanto a equipe já fez no período.
              </p>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-text-muted text-xs font-sans">
                Defina os 3 tiers da meta coletiva. Quando o faturamento atingir um tier, a equipe ganha o prêmio correspondente.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label metal-text-bronze">Bronze (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={metaColetivaBronzeVal}
                    onChange={e => setMetaColetivaBronzeVal(e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="label metal-text-silver">Prata (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={metaColetivaPrataVal}
                    onChange={e => setMetaColetivaPrataVal(e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="label metal-text-gold">Ouro (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={metaColetivaVal}
                    onChange={e => setMetaColetivaVal(e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">Prêmio Bronze</label>
                  <input
                    type="text"
                    value={premioBronzeVal}
                    onChange={e => setPremioBronzeVal(e.target.value)}
                    placeholder="Ex: Almoço" className="input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="label">Prêmio Prata</label>
                  <input
                    type="text"
                    value={premioPrataVal}
                    onChange={e => setPremioPrataVal(e.target.value)}
                    placeholder="Ex: Pizza" className="input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="label">Prêmio Ouro</label>
                  <input
                    type="text"
                    value={premioVal}
                    onChange={e => setPremioVal(e.target.value)}
                    placeholder="Ex: Churrasco" className="input py-2 text-sm"
                  />
                </div>
              </div>
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
