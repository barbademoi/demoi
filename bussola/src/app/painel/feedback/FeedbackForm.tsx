'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, User, Users } from 'lucide-react'
import Avatar from '@/components/Avatar'
import {
  CATEGORIAS as CATEGORIAS_PADRAO,
  PLACEHOLDER_EQUIPE,
  PLACEHOLDER_INDIVIDUAL,
  type EscopoFeedback,
} from '@/lib/feedbacks'
import { criarFeedback, atualizarFeedback, excluirFeedback } from './actions'

interface ProfItem {
  id: string
  nome: string
  foto_url: string | null
}

interface Inicial {
  id: string
  escopo: EscopoFeedback
  profissional_id: string | null
  texto: string
  categoria: string | null
}

interface Props {
  profissionais: ProfItem[]
  modo: 'novo' | 'editar'
  inicial?: Inicial
  escopoInicial?: EscopoFeedback
  categorizacaoAuto?: boolean
  categorias?: string[]
}

export default function FeedbackForm({ profissionais, modo, inicial, escopoInicial, categorizacaoAuto, categorias }: Props) {
  const CATEGORIAS = categorias && categorias.length > 0 ? categorias : CATEGORIAS_PADRAO
  const router = useRouter()
  const [escopo, setEscopo] = useState<EscopoFeedback>(inicial?.escopo ?? escopoInicial ?? 'individual')
  const [profId, setProfId] = useState<string>(inicial?.profissional_id ?? '')
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [categoria, setCategoria] = useState<string | null>(inicial?.categoria ?? null)
  const [sugCat, setSugCat] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)
  const [isPending, startTransition] = useTransition()

  const destinoPos = () =>
    escopo === 'equipe'
      ? '/painel/feedbacks-equipe'
      : modo === 'editar' && profId
        ? `/painel/profissionais/${profId}`
        : '/painel'

  function excluir() {
    if (!inicial) return
    startTransition(async () => {
      const res = await excluirFeedback(inicial.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      router.push(inicial.escopo === 'equipe' ? '/painel/feedbacks-equipe' : `/painel/profissionais/${inicial.profissional_id}`)
    })
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus quando o alvo já foi escolhido.
  useEffect(() => {
    if ((escopo === 'equipe' || profId) && modo === 'novo') textareaRef.current?.focus()
  }, [escopo, profId, modo])

  // Auto-resize.
  function ajustarAltura() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(ajustarAltura, [texto])

  // Sugestão de categoria pela IA (debounce 800ms).
  useEffect(() => {
    if (!categorizacaoAuto || modo !== 'novo') {
      setSugCat(null)
      return
    }
    const t = texto.trim()
    if (t.length < 10) {
      setSugCat(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch('/api/ia/sugerir-categoria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: t }),
        })
        const j = await r.json()
        if (r.ok && j.categoria) setSugCat(j.categoria)
      } catch {
        /* silencioso */
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [texto, categorizacaoAuto, modo])

  const profsFiltrados = busca.trim()
    ? profissionais.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : profissionais

  const profSelecionado = profissionais.find((p) => p.id === profId)
  const nomeAlvo = profSelecionado?.nome.split(' ')[0] ?? 'essa pessoa'
  const alvoOk = escopo === 'equipe' || !!profId
  const podeSalvar = alvoOk && texto.trim().length > 0

  function salvar() {
    if (!podeSalvar) return
    setError(null)
    const input = {
      escopo,
      profissional_id: escopo === 'equipe' ? null : profId,
      texto,
      categoria,
    }
    startTransition(async () => {
      if (modo === 'novo') {
        const res = await criarFeedback(input)
        if (res?.error) {
          setError(res.error)
          return
        }
      } else {
        const res = await atualizarFeedback(inicial!.id, input)
        if (res?.error) {
          setError(res.error)
          return
        }
      }
      setSalvo(true)
      setTimeout(() => router.push(destinoPos()), 700)
    })
  }

  const cancelarHref = () =>
    modo === 'editar' && inicial
      ? inicial.escopo === 'equipe'
        ? '/painel/feedbacks-equipe'
        : `/painel/profissionais/${inicial.profissional_id}`
      : '/painel'

  return (
    <div className="space-y-6 pb-28">
      {/* TOGGLE — INDIVIDUAL x EQUIPE */}
      <div className="grid grid-cols-2 gap-2">
        {([['individual', 'Para alguém', User], ['equipe', 'Para a equipe', Users]] as [EscopoFeedback, string, typeof User][]).map(([v, label, Icon]) => (
          <button
            key={v}
            type="button"
            onClick={() => setEscopo(v)}
            className={[
              'inline-flex items-center justify-center gap-2 py-3 rounded-md border text-sm font-semibold transition-colors',
              escopo === v ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-text hover:border-marrom/40',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* PASSO 1 — ALVO */}
      {escopo === 'individual' ? (
        <section>
          <h2 className="text-sm font-semibold text-text mb-2">Quem?</h2>
          {profissionais.length > 6 && (
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar colaborador…"
              className="input mb-3"
            />
          )}
          {profissionais.length === 0 ? (
            <p className="text-chumbo text-sm">Nenhum colaborador ativo. Cadastre um primeiro.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {profsFiltrados.map((p) => {
                const sel = profId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfId(p.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] snap-start"
                  >
                    <span
                      className={[
                        'rounded-full p-0.5 border-2 transition-colors relative',
                        sel ? 'border-marrom' : 'border-transparent',
                      ].join(' ')}
                    >
                      <Avatar nome={p.nome} fotoUrl={p.foto_url} size={56} />
                      {sel && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-marrom text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check size={12} strokeWidth={2} />
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-text text-center leading-tight line-clamp-2">
                      {p.nome.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <p className="text-chumbo text-sm bg-linho/50 rounded-md p-3">
          Esta observação é sobre a equipe como um todo. Aparece na pauta da reunião.
        </p>
      )}

      {/* PASSO 2 — TEXTO */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">O que você observou?</h2>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 2000))}
            placeholder={escopo === 'equipe' ? PLACEHOLDER_EQUIPE : PLACEHOLDER_INDIVIDUAL(nomeAlvo)}
            rows={4}
            className="input resize-none overflow-hidden min-h-[128px]"
          />
          <span className="absolute bottom-2 right-3 text-xs text-chumbo">
            {texto.length}/2000
          </span>
        </div>
      </section>

      {/* PASSO 3 — CATEGORIA */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">
          Categoria <span className="text-chumbo font-normal">(opcional)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => {
            const sel = categoria === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(sel ? null : c)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  sel ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-grafite hover:border-marrom/40',
                ].join(' ')}
              >
                {c}
              </button>
            )
          })}
        </div>
        {sugCat && categoria !== sugCat && (
          <button
            type="button"
            onClick={() => setCategoria(sugCat)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-marrom"
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Sugerido pela IA: <span className="font-semibold underline">{sugCat}</span> — tocar para usar
          </button>
        )}
      </section>

      {error && <p className="text-vinho text-sm">{error}</p>}

      {modo === 'editar' && (
        <button
          type="button"
          onClick={() => setConfirmarExcluir(true)}
          className="text-vinho text-sm hover:underline"
        >
          Excluir observação
        </button>
      )}

      {/* RODAPÉ FIXO (acima da bottom nav no mobile) */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={!podeSalvar || isPending}
            className="btn-primary flex-1"
          >
            {isPending ? 'Salvando…' : modo === 'novo' ? 'Salvar observação' : 'Salvar alterações'}
          </button>
          <a href={cancelarHref()} className="text-grafite hover:text-text px-4 py-4 text-sm">
            Cancelar
          </a>
        </div>
      </div>

      {salvo && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-verde-musgo text-white px-5 py-3 rounded-md shadow-media text-sm font-medium z-50">
          <Check size={16} strokeWidth={2} />
          Observação registrada
        </div>
      )}

      {confirmarExcluir && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setConfirmarExcluir(false)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Excluir esta observação?</h4>
            <p className="text-sm text-grafite mb-5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={excluir}
                disabled={isPending}
                className="btn-destrutivo flex-1"
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button type="button" onClick={() => setConfirmarExcluir(false)} className="text-grafite hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
