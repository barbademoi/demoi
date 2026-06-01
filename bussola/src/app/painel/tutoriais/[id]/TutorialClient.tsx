'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, Lightbulb } from 'lucide-react'
import type { PassoTutorial, CategoriaTutorial } from '@/lib/tutoriais'
import { marcarTutorialConcluido } from '../actions'

interface Props {
  id: string
  titulo: string
  categoriaNome: string
  categoria: CategoriaTutorial
  passos: PassoTutorial[]
  jaConcluido: boolean
  proximos: { id: string; titulo: string }[]
}

const SWIPE_MIN = 60

export default function TutorialClient({
  id,
  titulo,
  categoriaNome,
  passos,
  jaConcluido,
  proximos,
}: Props) {
  const router = useRouter()
  const [indice, setIndice] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  const [isPending, startTransition] = useTransition()
  const touchStartX = useRef<number | null>(null)

  const total = passos.length
  const ultimo = indice === total - 1
  const primeiro = indice === 0
  const passoAtual = passos[indice]

  const ir = (n: number) => {
    setIndice((i) => Math.max(0, Math.min(total - 1, i + n)))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finalizado) return
      if (e.key === 'ArrowRight' && !ultimo) ir(1)
      if (e.key === 'ArrowLeft' && !primeiro) ir(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ultimo, primeiro, finalizado])

  function concluir() {
    startTransition(async () => {
      const r = await marcarTutorialConcluido(id)
      if (!r?.error) {
        setFinalizado(true)
        router.refresh()
      }
    })
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) >= SWIPE_MIN) {
      if (dx < 0 && !ultimo) ir(1)
      if (dx > 0 && !primeiro) ir(-1)
    }
    touchStartX.current = null
  }

  if (total === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Link href="/painel/tutoriais" className="inline-flex items-center gap-1 text-sm text-grafite">
          <ChevronLeft size={16} strokeWidth={1.5} /> Voltar
        </Link>
        <h1 className="text-xl font-semibold text-text">{titulo}</h1>
        <p className="text-chumbo">Este tutorial ainda não tem passos publicados.</p>
      </main>
    )
  }

  if (finalizado) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in">
        <CheckCircle2 size={64} strokeWidth={1.5} className="mx-auto text-verde-musgo" />
        <h1 className="text-2xl font-semibold text-text mt-4">Tutorial concluído!</h1>
        <p className="text-chumbo mt-2">{titulo}</p>

        {proximos.length > 0 ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-grafite">Continue pela mesma categoria:</p>
            {proximos.slice(0, 1).map((p) => (
              <Link key={p.id} href={`/painel/tutoriais/${p.id}`} className="btn-primary w-full justify-center">
                Próximo tutorial: {p.titulo}
              </Link>
            ))}
            <Link href="/painel/tutoriais" className="block text-sm text-grafite mt-2">
              Voltar pra lista
            </Link>
          </div>
        ) : (
          <Link href="/painel/tutoriais" className="btn-primary inline-flex mt-8">
            Voltar pra lista
          </Link>
        )}
      </main>
    )
  }

  const pct = Math.round(((indice + 1) / total) * 100)

  return (
    <main
      className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between">
        <Link href="/painel/tutoriais" className="inline-flex items-center gap-1 text-sm text-grafite">
          <ChevronLeft size={16} strokeWidth={1.5} /> Voltar
        </Link>
        <span className="text-xs text-chumbo bg-linho rounded-full px-2.5 py-0.5">{categoriaNome}</span>
      </div>

      <header>
        <h1 className="text-2xl font-semibold text-text leading-tight">{titulo}</h1>
        {jaConcluido && (
          <p className="inline-flex items-center gap-1 text-xs text-verde-musgo mt-2">
            <CheckCircle2 size={13} strokeWidth={1.5} /> Você já concluiu este tutorial.
          </p>
        )}
        <div className="mt-3 space-y-1">
          <p className="text-xs text-chumbo">Passo {indice + 1} de {total}</p>
          <div className="h-1.5 w-full rounded-full bg-linho overflow-hidden">
            <div className="h-full bg-marrom transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      <article className="card p-5 sm:p-6 animate-fade-in" key={passoAtual.id}>
        <p className="text-xs font-semibold uppercase tracking-wide text-marrom">
          Passo {passoAtual.numero}
        </p>
        {passoAtual.titulo && (
          <h2 className="text-xl font-semibold text-text mt-1.5">{passoAtual.titulo}</h2>
        )}
        <p className="text-text text-[16px] leading-relaxed mt-3 whitespace-pre-wrap">
          {passoAtual.conteudo}
        </p>

        {passoAtual.dica && (
          <div className="mt-4 border-l-4 border-marrom bg-linho/50 p-3 rounded-r">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-marrom">
              <Lightbulb size={14} strokeWidth={1.5} /> Dica
            </p>
            <p className="text-sm text-text mt-1 whitespace-pre-wrap">{passoAtual.dica}</p>
          </div>
        )}
      </article>

      <footer className="flex items-center gap-2 pt-2">
        {!primeiro && (
          <button
            type="button"
            onClick={() => ir(-1)}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <ArrowLeft size={16} strokeWidth={1.5} /> Anterior
          </button>
        )}
        {!ultimo && (
          <button
            type="button"
            onClick={() => ir(1)}
            className="btn-primary flex-1 ml-auto"
          >
            Próximo <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        )}
        {ultimo && (
          <button
            type="button"
            onClick={concluir}
            disabled={isPending}
            className="btn-primary flex-1 ml-auto disabled:opacity-60"
          >
            {isPending ? 'Salvando…' : 'Concluir tutorial'} <CheckCircle2 size={16} strokeWidth={1.5} />
          </button>
        )}
      </footer>
    </main>
  )
}
