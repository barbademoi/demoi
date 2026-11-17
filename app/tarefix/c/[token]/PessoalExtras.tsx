'use client'

import { useState } from 'react'
import type { Categoria, ItemChecklist } from '@/lib/tarefix/tipos'
import type { PessoalTela } from '@/lib/tarefix/estadoHoje'

/* Peças do Meu dia (uso pessoal) usadas pela TelaHoje. */

export function corDe(categorias: Categoria[], id: string | null | undefined) {
  return categorias.find((c) => c.id === id) ?? null
}

/** Etiqueta colorida da categoria. */
export function EtiquetaCategoria({ categoria }: { categoria: Categoria | null }) {
  if (!categoria) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${categoria.cor}22`, color: categoria.cor }}>
      <span className="h-2 w-2 rounded-full" style={{ background: categoria.cor }} aria-hidden />
      {categoria.nome}
    </span>
  )
}

/** Adicionar rápido: "o que fazer" + quando + hora + categoria. */
export function BarraRapida({
  categorias,
  aoAdicionar,
}: {
  categorias: Categoria[]
  aoAdicionar: (d: { titulo: string; quando: 'hoje' | 'amanha' | 'algum' | 'data'; data?: string; horario?: string; categoria_id?: string | null }) => Promise<boolean>
}) {
  const [titulo, setTitulo] = useState('')
  const [quando, setQuando] = useState<'hoje' | 'amanha' | 'algum' | 'data'>('hoje')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [aberta, setAberta] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!titulo.trim() || enviando || (quando === 'data' && !data)) return
    setEnviando(true)
    const ok = await aoAdicionar({ titulo, quando, data: quando === 'data' ? data : undefined, horario: horario || undefined, categoria_id: categoria })
    setEnviando(false)
    if (ok) {
      setTitulo('')
      setHorario('')
    }
  }

  return (
    <form
      className="tf-cartao mt-4 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        enviar()
      }}
    >
      <div className="flex gap-2">
        <input
          className="tf-campo flex-1"
          placeholder="+ Adicionar tarefa…  ex.: Ligar pro fornecedor"
          value={titulo}
          maxLength={120}
          onFocus={() => setAberta(true)}
          onChange={(e) => setTitulo(e.target.value)}
          aria-label="Nova tarefa"
        />
        <button type="submit" className="tf-botao shrink-0 px-5" disabled={!titulo.trim() || enviando}>
          {enviando ? '…' : 'Adicionar'}
        </button>
      </div>
      {aberta && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['hoje', 'Hoje'],
                ['amanha', 'Amanhã'],
                ['data', '📅 Escolher data'],
                ['algum', 'Algum dia'],
              ] as const
            ).map(([v, r]) => (
              <button
                key={v}
                type="button"
                aria-pressed={quando === v}
                onClick={() => setQuando(v)}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-bold ${quando === v ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
              >
                {r}
              </button>
            ))}
            {quando === 'data' && (
              <input type="date" className="tf-campo !min-h-[40px] w-[170px] !py-1" min={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())} value={data} onChange={(e) => setData(e.target.value)} aria-label="Data da tarefa" />
            )}
            {quando !== 'algum' && (
              <label className="flex items-center gap-2 text-sm font-bold text-tf-suave">
                às
                <input type="time" className="tf-campo !min-h-[40px] w-[120px] !py-1" value={horario} onChange={(e) => setHorario(e.target.value)} aria-label="Horário (opcional)" />
              </label>
            )}
          </div>
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={categoria === c.id}
                  onClick={() => setCategoria(categoria === c.id ? null : c.id)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-sm font-bold"
                  style={categoria === c.id ? { background: c.cor, borderColor: c.cor, color: '#fff' } : { borderColor: `${c.cor}66`, color: c.cor }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: categoria === c.id ? '#fff' : c.cor }} aria-hidden />
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  )
}

/** Filtro por categoria (só aparece se alguma tarefa de hoje tiver categoria). */
export function FiltroCategorias({ categorias, usadas, filtro, aoMudar }: { categorias: Categoria[]; usadas: Set<string>; filtro: string | null; aoMudar: (v: string | null) => void }) {
  const lista = categorias.filter((c) => usadas.has(c.id))
  if (lista.length === 0) return null
  return (
    <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por categoria">
      <button
        type="button"
        aria-pressed={filtro === null}
        onClick={() => aoMudar(null)}
        className={`min-h-[36px] shrink-0 rounded-full border px-4 text-sm font-bold ${filtro === null ? 'border-tf-texto bg-tf-texto text-tf-fundo' : 'border-tf-borda text-tf-suave'}`}
      >
        Todas
      </button>
      {lista.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={filtro === c.id}
          onClick={() => aoMudar(filtro === c.id ? null : c.id)}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold"
          style={filtro === c.id ? { background: c.cor, borderColor: c.cor, color: '#fff' } : { borderColor: `${c.cor}66`, color: c.cor }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: filtro === c.id ? '#fff' : c.cor }} aria-hidden />
          {c.nome}
        </button>
      ))}
    </div>
  )
}

/** Subitens da tarefa, com progresso. */
export function Checklist({ itens, desabilitado, aoMarcar, claro = false }: { itens: ItemChecklist[]; desabilitado?: boolean; aoMarcar: (i: number, f: boolean) => void; claro?: boolean }) {
  if (!itens.length) return null
  const feitos = itens.filter((i) => i.f).length
  return (
    <div className="mt-2">
      <p className={`text-xs font-extrabold uppercase tracking-wide ${claro ? 'text-white/80' : 'text-tf-suave'}`}>
        Checklist · {feitos}/{itens.length}
      </p>
      <ul className="mt-1 space-y-1">
        {itens.map((i, n) => (
          <li key={n}>
            <button
              type="button"
              disabled={desabilitado}
              onClick={() => aoMarcar(n, !i.f)}
              aria-pressed={i.f}
              className="flex min-h-[36px] w-full items-center gap-2 text-left text-sm"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black ${
                  i.f ? (claro ? 'border-white bg-white text-tf-marca' : 'border-tf-marca bg-tf-marca text-white') : claro ? 'border-white/60' : 'border-tf-borda'
                }`}
                aria-hidden
              >
                {i.f ? '✓' : ''}
              </span>
              <span className={i.f ? 'line-through opacity-60' : ''}>{i.t}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Botão "adiar" com as três opções. */
export function MenuAdiar({ aoAdiar, desabilitado }: { aoAdiar: (o: '1h' | 'noite' | 'amanha') => void; desabilitado?: boolean }) {
  // menu "fixed" (o cartão da tarefa corta o que sai dele): posicionado pelo botão, sem sair da tela
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const aberto = pos !== null
  const setAberto = (v: boolean | ((a: boolean) => boolean)) => {
    const quer = typeof v === 'function' ? v(aberto) : v
    if (!quer) return setPos(null)
  }
  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={desabilitado}
        onClick={(e) => {
          if (aberto) return setPos(null)
          const r = e.currentTarget.getBoundingClientRect()
          const largura = 176
          const altura = 140
          const top = r.bottom + altura + 8 > window.innerHeight ? r.top - altura - 4 : r.bottom + 4
          setPos({ top, left: Math.max(12, Math.min(r.right - largura, window.innerWidth - largura - 12)) })
        }}
        aria-expanded={aberto}
        aria-label="Adiar"
        title="Adiar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tf-suave hover:bg-tf-marca-clara"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3" />
        </svg>
      </button>
      {aberto && (
        <>
          <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setAberto(false)} />
          <div className="fixed z-40 w-44 overflow-hidden rounded-2xl border border-tf-borda bg-tf-card shadow-2xl" style={{ top: pos!.top, left: pos!.left }}>
            {(
              [
                ['1h', '+1 hora'],
                ['noite', 'Hoje à noite'],
                ['amanha', 'Amanhã'],
              ] as const
            ).map(([v, r]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setAberto(false)
                  aoAdiar(v)
                }}
                className="block min-h-[44px] w-full px-4 text-left font-bold hover:bg-tf-marca-clara"
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Caixa "Algum dia": ideias sem data. */
export function AlgumDia({ pessoal, aoMover, desabilitado }: { pessoal: PessoalTela; aoMover: (id: string, para: 'hoje' | 'amanha' | 'apagar' | 'data', data?: string) => void; desabilitado?: boolean }) {
  const [aberta, setAberta] = useState(false)
  const [escolhendo, setEscolhendo] = useState<string | null>(null)
  const [data, setData] = useState('')
  if (pessoal.algumDia.length === 0) return null
  return (
    <section className="tf-cartao mt-6">
      <button type="button" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 text-left">
        <span className="font-extrabold">
          💡 Algum dia <span className="font-bold text-tf-suave">({pessoal.algumDia.length})</span>
        </span>
        <span className="text-xl text-tf-suave" aria-hidden>
          {aberta ? '−' : '+'}
        </span>
      </button>
      {aberta && (
        <ul className="divide-y divide-tf-borda border-t border-tf-borda">
          {pessoal.algumDia.map((i) => (
            <li key={i.id} className="px-5 py-3">
              <p className="font-bold">{i.titulo}</p>
              <div className="mt-1">
                <EtiquetaCategoria categoria={corDe(pessoal.categorias, i.categoria_id)} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={desabilitado} onClick={() => aoMover(i.id, 'hoje')} className="min-h-[36px] rounded-full bg-tf-marca px-4 text-sm font-bold text-white">
                  Fazer hoje
                </button>
                <button type="button" disabled={desabilitado} onClick={() => aoMover(i.id, 'amanha')} className="min-h-[36px] rounded-full border border-tf-borda px-4 text-sm font-bold">
                  Amanhã
                </button>
                <button type="button" disabled={desabilitado} onClick={() => (setData(''), setEscolhendo(escolhendo === i.id ? null : i.id))} className="min-h-[36px] rounded-full border border-tf-borda px-4 text-sm font-bold">
                  📅 Data
                </button>
                <button
                  type="button"
                  disabled={desabilitado}
                  onClick={() => confirm(`Apagar "${i.titulo}"?`) && aoMover(i.id, 'apagar')}
                  className="min-h-[36px] px-2 text-sm font-bold text-tf-suave"
                >
                  Apagar
                </button>
              </div>
              {escolhendo === i.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    className="tf-campo !min-h-[40px] flex-1 !py-1"
                    min={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    aria-label={`Data para ${i.titulo}`}
                  />
                  <button type="button" className="tf-botao shrink-0 !min-h-[40px] px-4 text-sm" disabled={!data || desabilitado} onClick={() => (aoMover(i.id, 'data', data), setEscolhendo(null))}>
                    Agendar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Avulsas já agendadas para os próximos dias (para ver o que vem por aí). */
export function ProximosDias({ pessoal }: { pessoal: PessoalTela }) {
  const [aberta, setAberta] = useState(false)
  if (pessoal.proximas.length === 0) return null
  const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const rotulo = (d: string) => `${nomes[new Date(`${d}T12:00:00Z`).getUTCDay()]}, ${d.slice(8, 10)}/${d.slice(5, 7)}`
  return (
    <section className="tf-cartao mt-4">
      <button type="button" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} className="flex min-h-[56px] w-full items-center justify-between gap-3 px-5 text-left">
        <span className="font-extrabold">
          📅 Próximos dias <span className="font-bold text-tf-suave">({pessoal.proximas.length})</span>
        </span>
        <span className="text-xl text-tf-suave" aria-hidden>
          {aberta ? '−' : '+'}
        </span>
      </button>
      {aberta && (
        <ul className="divide-y divide-tf-borda border-t border-tf-borda">
          {pessoal.proximas.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-[4.5rem] shrink-0 text-sm font-extrabold text-tf-marca-texto">{rotulo(p.data)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{p.titulo}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-tf-suave">
                  {p.horario && <span>às {p.horario}</span>}
                  <EtiquetaCategoria categoria={corDe(pessoal.categorias, p.categoria_id)} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
