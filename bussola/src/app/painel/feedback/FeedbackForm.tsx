'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
import {
  TIPOS,
  CATEGORIAS,
  PLACEHOLDERS,
  PLACEHOLDERS_EQUIPE,
  labelEstrelas,
  type EscopoFeedback,
  type TipoFeedback,
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
  tipo: TipoFeedback
  texto: string
  estrelas: number | null
  categoria: string | null
}

interface Props {
  profissionais: ProfItem[]
  modo: 'novo' | 'editar'
  inicial?: Inicial
  escopoInicial?: EscopoFeedback
  categorizacaoAuto?: boolean
}

export default function FeedbackForm({ profissionais, modo, inicial, escopoInicial, categorizacaoAuto }: Props) {
  const router = useRouter()
  const [escopo, setEscopo] = useState<EscopoFeedback>(inicial?.escopo ?? escopoInicial ?? 'individual')
  const [profId, setProfId] = useState<string>(inicial?.profissional_id ?? '')
  const [tipo, setTipo] = useState<TipoFeedback | ''>(inicial?.tipo ?? '')
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [estrelas, setEstrelas] = useState(inicial?.estrelas ?? 0)
  const [categoria, setCategoria] = useState<string | null>(inicial?.categoria ?? null)
  const [sugCat, setSugCat] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [carencia, setCarencia] = useState<{ id: string; atraso: number; nome: string } | null>(null)
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

  // Auto-focus no texto quando alvo + tipo já escolhidos.
  useEffect(() => {
    if ((escopo === 'equipe' || profId) && tipo && modo === 'novo') textareaRef.current?.focus()
  }, [escopo, profId, tipo, modo])

  // Auto-resize da textarea.
  function ajustarAltura() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(ajustarAltura, [texto])

  // Sugestão de categoria pela IA (debounce 800ms).
  useEffect(() => {
    if (!categorizacaoAuto || modo !== 'novo' || !tipo) {
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
          body: JSON.stringify({ texto: t, tipo }),
        })
        const j = await r.json()
        if (r.ok && j.categoria) setSugCat(j.categoria)
      } catch {
        /* silencioso */
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [texto, tipo, categorizacaoAuto, modo])

  const profsFiltrados = busca.trim()
    ? profissionais.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : profissionais

  const alvoOk = escopo === 'equipe' || !!profId
  const podeSalvar = alvoOk && !!tipo && texto.trim().length > 0 && estrelas >= 1

  function salvar() {
    if (!podeSalvar || !tipo) return
    setError(null)
    const input = {
      escopo,
      profissional_id: escopo === 'equipe' ? null : profId,
      tipo,
      texto,
      estrelas,
      categoria,
    }
    startTransition(async () => {
      if (modo === 'novo') {
        const res = await criarFeedback(input)
        if (res?.error) {
          setError(res.error)
          return
        }
        // Negativo individual → aviso de carência (pode editar/excluir antes de aparecer).
        if (res?.carencia && res.id) {
          const prof = profissionais.find((p) => p.id === profId)
          setCarencia({ id: res.id, atraso: res.atraso ?? 5, nome: (prof?.nome ?? '').split(' ')[0] })
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
        {([['individual', '👤 Para alguém'], ['equipe', '👥 Para a equipe']] as [EscopoFeedback, string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setEscopo(v)}
            className={[
              'py-3 rounded-xl border text-sm font-semibold transition-colors',
              escopo === v ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text hover:border-primary/40',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PASSO 1 — ALVO */}
      {escopo === 'individual' ? (
        <section>
          <h2 className="text-sm font-semibold text-text mb-2">1. Quem?</h2>
          {profissionais.length > 6 && (
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar profissional…"
              className="input mb-3"
            />
          )}
          {profissionais.length === 0 ? (
            <p className="text-text-muted text-sm">Nenhum profissional ativo. Cadastre um primeiro.</p>
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
                        sel ? 'border-primary' : 'border-transparent',
                      ].join(' ')}
                    >
                      <Avatar nome={p.nome} fotoUrl={p.foto_url} size={56} />
                      {sel && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          ✓
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
        <p className="text-text-muted text-sm bg-primary-soft/50 rounded-xl p-3">
          Este feedback é sobre a equipe como um todo. Aparecerá na pauta da reunião e no placar de
          equipe da Home.
        </p>
      )}

      {/* PASSO 2 — TIPO */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">2. Que tipo?</h2>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TIPOS) as TipoFeedback[]).map((t) => {
            const meta = TIPOS[t]
            const sel = tipo === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={[
                  'py-3 rounded-xl border text-sm font-medium transition-colors',
                  sel ? meta.selecionado : 'border-border bg-white text-text hover:border-primary/40',
                ].join(' ')}
              >
                <span className="block text-xl">{meta.emoji}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* PASSO 3 — TEXTO */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">3. O que aconteceu?</h2>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 500))}
            placeholder={tipo ? (escopo === 'equipe' ? PLACEHOLDERS_EQUIPE[tipo] : PLACEHOLDERS[tipo]) : 'Escolha o tipo acima…'}
            rows={3}
            className="input resize-none overflow-hidden min-h-[96px]"
          />
          <span className="absolute bottom-2 right-3 text-xs text-text-muted/70">
            {texto.length}/500
          </span>
        </div>
      </section>

      {/* PASSO 4 — ESTRELAS */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">4. Intensidade</h2>
        <div className="flex items-center gap-3">
          <Estrelas
            value={estrelas}
            onChange={setEstrelas}
            size={34}
            cor={tipo ? TIPOS[tipo].estrela : '#F5B301'}
          />
          {tipo && estrelas > 0 && (
            <span className="text-sm text-text-muted">{labelEstrelas(tipo, estrelas)}</span>
          )}
        </div>
      </section>

      {/* PASSO 5 — CATEGORIA */}
      <section>
        <h2 className="text-sm font-semibold text-text mb-2">
          5. Categoria <span className="text-text-muted font-normal">(opcional)</span>
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
                  sel ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted hover:border-primary/40',
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
            className="mt-2 text-xs text-primary"
          >
            ✨ Sugerido pela IA: <span className="font-semibold underline">{sugCat}</span> — tocar para usar
          </button>
        )}
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {modo === 'editar' && (
        <button
          type="button"
          onClick={() => setConfirmarExcluir(true)}
          className="text-red-600 text-sm hover:underline"
        >
          Excluir feedback
        </button>
      )}

      {/* RODAPÉ FIXO */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={!podeSalvar || isPending}
            className="btn-primary flex-1"
          >
            {isPending ? 'Salvando…' : modo === 'novo' ? 'Salvar feedback' : 'Salvar alterações'}
          </button>
          <a href={cancelarHref()} className="text-text-muted hover:text-text px-4 py-4 text-sm">
            Cancelar
          </a>
        </div>
      </div>

      {salvo && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          ✓ Feedback registrado!
        </div>
      )}

      {confirmarExcluir && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmarExcluir(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Excluir este feedback?</h4>
            <p className="text-sm text-text-muted mb-5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={excluir}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button type="button" onClick={() => setConfirmarExcluir(false)} className="text-text-muted hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVISO DE CARÊNCIA — negativo individual */}
      {carencia && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md p-5">
            <div className="text-3xl mb-2">🌱</div>
            <h4 className="font-semibold text-text mb-2">Feedback registrado!</h4>
            <p className="text-sm text-text-muted mb-5">
              Como é um ponto a desenvolver, ele só vai aparecer
              {carencia.nome ? <> pra <span className="font-semibold text-text">{carencia.nome}</span></> : ' pro profissional'}{' '}
              em <span className="font-semibold text-text">{carencia.atraso} {carencia.atraso === 1 ? 'minuto' : 'minutos'}</span>.
              Até lá você pode editar ou excluir.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => router.push('/painel')}
                className="btn-primary w-full"
              >
                OK, entendi
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/painel/feedback/${carencia.id}/editar`)}
                  className="flex-1 py-3 rounded-xl border border-border bg-white text-text font-medium hover:border-primary/40 transition-colors"
                >
                  Editar agora
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await excluirFeedback(carencia.id)
                      router.push('/painel')
                    })
                  }}
                  className="flex-1 py-3 rounded-xl border border-red-200 bg-white text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {isPending ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
