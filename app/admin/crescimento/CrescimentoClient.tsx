'use client'

import { useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import type { CrescimentoBarbearia, MotivoInconfiavel } from './actions'
import type { FiltrosCrescimento } from './filtros'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const MOTIVOS: Record<MotivoInconfiavel, string> = {
  sem_lancamento:  'Nunca lançou faturamento',
  so_mes_em_curso: 'Só tem o mês em curso — nenhum mês fechado ainda',
  base_fraca:      'Mês fechado abaixo do piso de faturamento',
  poucos_dias:     'Lançou em poucos dias no mês',
  poucos_meses:    'Ainda não tem meses fechados suficientes',
}

function money(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function pct(v: number | null) {
  if (v === null) return '—'
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function mesAno(mes: number | null, ano: number | null) {
  if (!mes || !ano) return '—'
  return `${MESES[mes - 1]}/${String(ano).slice(2)}`
}

function dataCurta(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .format(new Date(iso + 'T12:00:00'))
}

function mediana(vals: number[]): number | null {
  if (vals.length === 0) return null
  const s = [...vals].sort((a, b) => a - b)
  const m = s.length % 2 === 1
    ? s[(s.length - 1) / 2]
    : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
  return Math.round(m * 10) / 10
}

/** Link do PNG: leva os MESMOS filtros, senão a imagem sairia com outro número. */
function linkImagem(id: string, filtros: FiltrosCrescimento, formato: '4x5' | '1x1') {
  const p = new URLSearchParams({
    id, formato,
    ciclos: String(filtros.ciclos), piso: String(filtros.piso),
    dias: String(filtros.diasMinimos), meses: String(filtros.mesesMinimos),
    outlier: String(filtros.outlierPct),
  })
  return `/admin/crescimento/imagem?${p.toString()}`
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-')
   .replace(/^-|-$/g, '').toLowerCase() || 'barbearia'

export default function CrescimentoClient({
  rows,
  filtros,
}: {
  rows: CrescimentoBarbearia[]
  filtros: FiltrosCrescimento
}) {
  const [busca, setBusca] = useState('')
  const [verInsuficientes, setVerInsuficientes] = useState(false)

  const termo = busca.trim().toLowerCase()
  const filtra = (r: CrescimentoBarbearia) => !termo || r.nome.toLowerCase().includes(termo)

  const confiaveis = useMemo(() => rows.filter(r => r.confiavel), [rows])
  const insuficientes = useMemo(() => rows.filter(r => !r.confiavel), [rows])

  // Estatística SÓ sobre dado confiável, e ainda sem os outliers — era isso
  // que contaminava o "crescimento típico" com percentual de base zerada.
  const paraEstatistica = useMemo(
    () => confiaveis.filter(r => !r.outlier && r.crescimentoPct !== null).map(r => r.crescimentoPct as number),
    [confiaveis],
  )
  const medianaCrescimento = mediana(paraEstatistica)
  const somaRef = confiaveis.reduce((s, r) => s + r.refValor, 0)
  const somaAnt = confiaveis.reduce((s, r) => s + r.antValor, 0)
  const crescimentoRede = somaAnt > 0 ? Math.round(((somaRef - somaAnt) / somaAnt) * 1000) / 10 : null

  const visiveisConf = confiaveis.filter(filtra)
  const visiveisInsuf = insuficientes.filter(filtra)

  const corDe = (r: CrescimentoBarbearia) =>
    r.crescimentoPct === null ? '#a1a1aa' : r.crescimentoPct >= 0 ? '#34d399' : '#f87171'

  return (
    <div className="space-y-5">
      {/* Números da rede — só dado confiável. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Crescimento típico</p>
          <p className={`mt-1 font-serif text-3xl ${
            medianaCrescimento === null ? 'text-text-muted'
              : medianaCrescimento >= 0 ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {pct(medianaCrescimento)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            mediana de {paraEstatistica.length} {paraEstatistica.length === 1 ? 'barbearia' : 'barbearias'} · sem outliers
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Somado das confiáveis</p>
          <p className={`mt-1 font-serif text-3xl ${
            crescimentoRede === null ? 'text-text-muted' : crescimentoRede >= 0 ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {pct(crescimentoRede)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{money(somaAnt)} → {money(somaRef)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Com dado confiável</p>
          <p className="mt-1 font-serif text-3xl text-text tabular-nums">
            {confiaveis.length}<span className="text-lg text-text-muted">/{rows.length}</span>
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{insuficientes.length} sem dado suficiente</p>
        </div>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar barbearia…"
        className="input w-full text-[16px]"
        style={{ fontSize: '16px' }}
      />

      {/* ── Confiáveis ── */}
      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold text-text">
          Dado confiável <span className="font-normal text-text-muted">({visiveisConf.length})</span>
        </h2>
        <div className="card divide-y divide-border overflow-hidden">
          {visiveisConf.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">
              Nenhuma barbearia atinge {filtros.mesesMinimos} meses fechados acima de {money(filtros.piso)} com
              lançamento em {filtros.diasMinimos}+ dias. Afrouxe os pisos acima pra ver mais.
            </p>
          ) : (
            visiveisConf.map((r) => (
              <div key={r.barbeariaId} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[13rem] flex-1">
                  <p className="truncate font-sans font-semibold text-text">
                    {r.nome}
                    {r.outlier && (
                      <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                        outlier
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-text">
                    <span className="text-text-muted">{money(r.antValor)}</span>
                    <span className="text-text-muted"> em {mesAno(r.antMes, r.antAno)} → </span>
                    <span className="font-semibold">{money(r.refValor)}</span>
                    <span className="text-text-muted"> em {mesAno(r.refMes, r.refAno)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {/* Cidade nunca quebra: cadastro antigo pode não ter. */}
                    {r.cidade ?? 'cidade não informada'} · {r.qtdBarbeiros} {r.qtdBarbeiros === 1 ? 'barbeiro' : 'barbeiros'}
                    {' · entrou em '}{dataCurta(r.entrouEm)} · {r.mesesValidos} {r.mesesValidos === 1 ? 'mês válido' : 'meses válidos'}
                    {/* Meses não vizinhos: dizer "mês a mês" seria mentira. */}
                    {r.consecutivos === false && ' · meses não consecutivos'}
                    {r.crescimentoTotal !== null && ` · ${pct(r.crescimentoTotal)} desde ${mesAno(r.primeiroMes, r.primeiroAno)}`}
                  </p>
                </div>

                <Sparkline serie={r.serie} cor={corDe(r)} />

                <div className="flex shrink-0 items-center gap-3">
                  <span className="min-w-[5.5rem] text-right">
                    <span className={`block font-serif text-xl tabular-nums ${
                      r.crescimentoPct === null ? 'text-text-muted'
                        : r.crescimentoPct >= 0 ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {pct(r.crescimentoPct)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">mês fechado</span>
                  </span>

                  <span className="flex flex-col gap-1">
                    <a
                      href={linkImagem(r.barbeariaId, filtros, '4x5')}
                      download={`barbermeta-${slug(r.nome)}-4x5.png`}
                      className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-center text-xs font-semibold text-text hover:bg-primary/20"
                    >
                      Baixar imagem 4:5
                    </a>
                    <a
                      href={linkImagem(r.barbeariaId, filtros, '1x1')}
                      download={`barbermeta-${slug(r.nome)}-1x1.png`}
                      className="rounded-lg border border-border px-3 py-1.5 text-center text-xs text-text-muted hover:text-text"
                    >
                      quadrada 1:1
                    </a>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Sem dado suficiente — fora de toda estatística ── */}
      <section>
        <button
          type="button"
          onClick={() => setVerInsuficientes(v => !v)}
          className="mb-2 flex w-full items-center justify-between gap-3 text-left"
        >
          <h2 className="font-sans text-sm font-semibold text-text-muted">
            Sem dado suficiente <span className="font-normal">({visiveisInsuf.length})</span>
          </h2>
          <span className="text-xs text-text-muted underline">{verInsuficientes ? 'ocultar' : 'mostrar'}</span>
        </button>

        {verInsuficientes && (
          <div className="card divide-y divide-border overflow-hidden opacity-90">
            {visiveisInsuf.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">Nenhuma nesta busca.</p>
            ) : (
              visiveisInsuf.map((r) => (
                <div key={r.barbeariaId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-sans font-medium text-text">{r.nome}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {r.cidade ?? 'cidade não informada'} · {r.qtdBarbeiros} {r.qtdBarbeiros === 1 ? 'barbeiro' : 'barbeiros'}
                      {' · '}{r.motivo ? MOTIVOS[r.motivo] : 'Sem dado suficiente'}
                      {r.mesesValidos > 0 && ` · ${r.mesesValidos} ${r.mesesValidos === 1 ? 'mês válido' : 'meses válidos'}`}
                      {' · entrou em '}{dataCurta(r.entrouEm)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-text-muted">
                    sem %
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-text-muted">
        Entra na conta só o mês <span className="text-text">fechado</span> (o mês em curso está pela metade),
        com faturamento de pelo menos <span className="text-text">{money(filtros.piso)}</span> e lançamento em
        pelo menos <span className="text-text">{filtros.diasMinimos} dias</span> — e a barbearia precisa ter
        {' '}<span className="text-text">{filtros.mesesMinimos} meses</span> assim. É o que impede um mês de teste
        de R$ 48 virar denominador e gerar percentual astronômico. Acima de {filtros.outlierPct}% a linha é
        marcada como outlier e fica fora da mediana. O faturamento segue a regra do painel do dono: o valor
        informado nas metas quando preenchido, senão a soma dos lançamentos dos barbeiros ativos.
      </p>
    </div>
  )
}
