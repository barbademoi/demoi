'use client'

import { Dica } from './Dica'

import { useEffect, useRef, useState, useTransition } from 'react'
import { NOMES_DIAS_CURTOS } from '@/lib/tarefix/datas'

/* ------------------------------------------------------------------ */
/* Modal / folha inferior (no celular sobe de baixo)                   */
/* ------------------------------------------------------------------ */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
    }
  }, [aberto, aoFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={aoFechar} />
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-tf-card p-5 pb-8 sm:rounded-3xl sm:pb-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold">{titulo}</h2>
          <button type="button" onClick={aoFechar} className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-tf-suave hover:bg-tf-marca-clara" aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Interruptor (toggle) com área de toque ≥ 48px                       */
/* ------------------------------------------------------------------ */
export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  descricao,
  desabilitado,
  dica,
  exemplo,
}: {
  ligado: boolean
  aoMudar: (v: boolean) => void
  rotulo: string
  descricao?: string
  desabilitado?: boolean
  /** Texto da dica "?" ao lado do rótulo (opcional). */
  dica?: React.ReactNode
  exemplo?: React.ReactNode
}) {
  if (!dica)
    return (
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        disabled={desabilitado}
        onClick={() => aoMudar(!ligado)}
        className="flex min-h-[48px] w-full items-center justify-between gap-4 text-left disabled:opacity-50"
      >
        <span>
          <span className="block font-bold">{rotulo}</span>
          {descricao && <span className="block text-sm text-tf-suave">{descricao}</span>}
        </span>
        <Chave ligado={ligado} />
      </button>
    )
  return (
    <div className={`flex min-h-[48px] w-full items-center justify-between gap-4 ${desabilitado ? 'opacity-50' : ''}`}>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="cursor-pointer font-bold" onClick={() => !desabilitado && aoMudar(!ligado)}>
            {rotulo}
          </span>
          <Dica titulo={rotulo} exemplo={exemplo}>
            {dica}
          </Dica>
        </span>
        {descricao && <span className="block text-sm text-tf-suave">{descricao}</span>}
      </span>
      <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} disabled={desabilitado} onClick={() => aoMudar(!ligado)} className="shrink-0">
        <Chave ligado={ligado} />
      </button>
    </div>
  )
}

function Chave({ ligado }: { ligado: boolean }) {
  return (
    <span className={`relative block h-7 w-12 shrink-0 rounded-full transition ${ligado ? 'bg-tf-marca' : 'bg-tf-borda'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${ligado ? 'left-6' : 'left-1'}`} />
    </span>
  )
}

/** Rótulo de campo com dica "?" ao lado. */
export function Rotulo({ htmlFor, children, dica, exemplo }: { htmlFor?: string; children: React.ReactNode; dica?: React.ReactNode; exemplo?: React.ReactNode }) {
  const texto = typeof children === 'string' ? children : undefined
  return (
    <span className="tf-rotulo !flex items-center gap-2">
      {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : <span>{children}</span>}
      {dica && (
        <Dica titulo={texto} exemplo={exemplo}>
          {dica}
        </Dica>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Chips de dias da semana (Dom..Sáb)                                  */
/* ------------------------------------------------------------------ */
export function ChipsDias({ valor, aoMudar }: { valor: number[]; aoMudar: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOMES_DIAS_CURTOS.map((nome, i) => {
        const ativo = valor.includes(i)
        return (
          <button
            key={nome}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoMudar(ativo ? valor.filter((d) => d !== i) : [...valor, i].sort())}
            className={`h-12 min-w-[48px] rounded-xl px-3 text-sm font-bold transition ${
              ativo ? 'bg-tf-marca text-white' : 'border border-tf-borda bg-tf-card text-tf-suave'
            }`}
          >
            {nome}
          </button>
        )
      })}
    </div>
  )
}

/** "Seg, Qua, Sex" / "Todos os dias" / "Seg a Sáb" */
export function resumoDias(dias: number[]): string {
  const d = [...dias].sort()
  if (d.length === 7) return 'Todos os dias'
  if (d.length === 0) return 'Nenhum dia'
  if (d.join() === '1,2,3,4,5,6') return 'Seg a Sáb'
  if (d.join() === '1,2,3,4,5') return 'Seg a Sex'
  return d.map((i) => NOMES_DIAS_CURTOS[i]).join(', ')
}

/* ------------------------------------------------------------------ */
/* Avatar (foto ou iniciais)                                           */
/* ------------------------------------------------------------------ */
export function Avatar({ nome, url, tamanho = 48 }: { nome: string; url?: string | null; tamanho?: number }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={tamanho} height={tamanho} className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-tf-marca-clara font-extrabold text-tf-marca-texto"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
      aria-hidden
    >
      {iniciais || '?'}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Mensagem de erro / sucesso                                          */
/* ------------------------------------------------------------------ */
export function Erro({ texto }: { texto: string | null }) {
  if (!texto) return null
  return (
    <p role="alert" className="rounded-xl border border-tf-borda bg-tf-marca-clara px-4 py-3 text-sm font-bold">
      {texto}
    </p>
  )
}

/** Toast curto no rodapé. */
export function useAviso() {
  const [texto, setTexto] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  function mostrar(t: string) {
    setTexto(t)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTexto(null), 2500)
  }
  const elemento = texto ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
      <div className="rounded-full bg-tf-texto px-5 py-3 text-sm font-bold text-tf-fundo">{texto}</div>
    </div>
  ) : null
  return { mostrar, elemento }
}

/**
 * Roda uma server action que devolve { ok, erro }, controlando "salvando…" e erro.
 */
export function useAcao() {
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  function rodar(fn: () => Promise<{ ok: boolean; erro?: string }>, aoTerminar?: () => void) {
    setErro(null)
    iniciar(async () => {
      try {
        const r = await fn()
        if (!r.ok) setErro(r.erro ?? 'Algo deu errado.')
        else aoTerminar?.()
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Algo deu errado.')
      }
    })
  }
  return { pendente, erro, setErro, rodar }
}

/* ------------------------------------------------------------------ */
/* Cabeçalho de página                                                 */
/* ------------------------------------------------------------------ */
export function Titulo({ children, acao }: { children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">{children}</h1>
      {acao}
    </div>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: React.ReactNode }) {
  return (
    <div className="tf-cartao flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="text-lg font-extrabold">{titulo}</p>
      {texto && <p className="text-tf-suave">{texto}</p>}
      {acao}
    </div>
  )
}
