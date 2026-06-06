'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Lock, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import Modal from '@/components/Modal'
import { ListExpander } from '@/components/ui/ListExpander'
import { marcarMensagemComoLida } from '@/app/p/[slug]/actions'

export interface ItemMensagem {
  id: string
  colaborador_id: string | null
  conteudo: string
  anonimo: boolean
  lida: boolean
  deletada: boolean
  deletada_em: string | null
  created_at: string
  profissionais: { nome: string } | null
}

function tempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  if (d < 7) return `há ${d} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function dataLonga(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Aba = 'ativas' | 'excluidas'
type Toast = { tipo: 'sucesso' | 'erro'; texto: string } | null
type Confirmacao =
  | { acao: 'deletar'; id: string }
  | { acao: 'apagar'; id: string }
  | null

export function MensagensClient({ itens: itensIniciais }: { itens: ItemMensagem[] }) {
  const router = useRouter()
  const [itens, setItens] = useState(itensIniciais)
  const [aba, setAba] = useState<Aba>('ativas')
  const [toast, setToast] = useState<Toast>(null)
  const [confirmar, setConfirmar] = useState<Confirmacao>(null)
  const [removendo, setRemovendo] = useState<Set<string>>(new Set())

  const mostrarToast = (t: Toast) => {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  const ativas = itens.filter((m) => !m.deletada)
  const excluidas = itens.filter((m) => m.deletada)

  const onMarcouLida = (id: string) =>
    setItens((arr) => arr.map((x) => (x.id === id ? { ...x, lida: true } : x)))

  // Soft delete: animação fade-out 250ms antes de remover do state
  const executarDeletar = async (id: string) => {
    setRemovendo((s) => new Set(s).add(id))
    setTimeout(async () => {
      const res = await fetch(`/api/mensagens/${id}/deletar`, { method: 'POST' })
      if (res.ok) {
        setItens((arr) =>
          arr.map((x) => (x.id === id ? { ...x, deletada: true, deletada_em: new Date().toISOString() } : x)),
        )
        mostrarToast({ tipo: 'sucesso', texto: 'Mensagem excluída. Veja em "Excluídas" pra restaurar.' })
        router.refresh()
      } else {
        mostrarToast({ tipo: 'erro', texto: 'Não foi possível excluir.' })
      }
      setRemovendo((s) => {
        const novo = new Set(s)
        novo.delete(id)
        return novo
      })
    }, 250)
  }

  const executarRestaurar = async (id: string) => {
    const res = await fetch(`/api/mensagens/${id}/restaurar`, { method: 'POST' })
    if (res.ok) {
      setItens((arr) =>
        arr.map((x) => (x.id === id ? { ...x, deletada: false, deletada_em: null } : x)),
      )
      mostrarToast({ tipo: 'sucesso', texto: 'Mensagem restaurada.' })
      router.refresh()
    } else {
      mostrarToast({ tipo: 'erro', texto: 'Não foi possível restaurar.' })
    }
  }

  const executarApagar = async (id: string) => {
    setRemovendo((s) => new Set(s).add(id))
    setTimeout(async () => {
      const res = await fetch(`/api/mensagens/${id}/apagar`, { method: 'DELETE' })
      if (res.ok) {
        setItens((arr) => arr.filter((x) => x.id !== id))
        mostrarToast({ tipo: 'sucesso', texto: 'Mensagem apagada permanentemente.' })
        router.refresh()
      } else {
        mostrarToast({ tipo: 'erro', texto: 'Não foi possível apagar.' })
      }
      setRemovendo((s) => {
        const novo = new Set(s)
        novo.delete(id)
        return novo
      })
    }, 250)
  }

  // Empty state geral
  if (itens.length === 0) {
    return (
      <div className="card p-8 text-center space-y-2">
        <p className="text-text font-medium">Nenhuma mensagem ainda.</p>
        <p className="text-sm text-chumbo">
          Quando alguém da equipe enviar algo pelo link público, aparece aqui.
        </p>
      </div>
    )
  }

  const naoLidasAtivas = ativas.filter((m) => !m.lida)
  const lidasAtivas = ativas.filter((m) => m.lida)

  return (
    <div className="space-y-5">
      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-border">
        <AbaButton
          ativa={aba === 'ativas'}
          onClick={() => setAba('ativas')}
          label="Ativas"
          contagem={ativas.length}
        />
        <AbaButton
          ativa={aba === 'excluidas'}
          onClick={() => setAba('excluidas')}
          label="Excluídas"
          contagem={excluidas.length}
        />
      </div>

      {/* Conteúdo da aba */}
      {aba === 'ativas' ? (
        <div className="space-y-6">
          {ativas.length === 0 && (
            <p className="text-chumbo text-sm text-center py-8">
              Nenhuma mensagem ativa.
            </p>
          )}

          {naoLidasAtivas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-text">
                Novas <span className="text-chumbo font-normal">· {naoLidasAtivas.length}</span>
              </h2>
              <ListExpander
                items={naoLidasAtivas}
                initialCount={5}
                renderItem={(m) => (
                  <CardAtivo
                    mensagem={m}
                    removendo={removendo.has(m.id)}
                    onMarcouLida={onMarcouLida}
                    onDeletar={() => setConfirmar({ acao: 'deletar', id: m.id })}
                  />
                )}
                showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'mensagem' : 'mensagens'}`}
              />
            </section>
          )}

          {lidasAtivas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-chumbo">
                Lidas <span className="font-normal">· {lidasAtivas.length}</span>
              </h2>
              <ListExpander
                items={lidasAtivas}
                initialCount={5}
                renderItem={(m) => (
                  <CardAtivo
                    mensagem={m}
                    removendo={removendo.has(m.id)}
                    onMarcouLida={onMarcouLida}
                    onDeletar={() => setConfirmar({ acao: 'deletar', id: m.id })}
                  />
                )}
                showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'mensagem' : 'mensagens'}`}
              />
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {excluidas.length === 0 ? (
            <p className="text-chumbo text-sm text-center py-8">
              Nenhuma mensagem excluída.
            </p>
          ) : (
            <ListExpander
              items={excluidas}
              initialCount={5}
              renderItem={(m) => (
                <CardExcluido
                  mensagem={m}
                  removendo={removendo.has(m.id)}
                  onRestaurar={executarRestaurar}
                  onApagar={() => setConfirmar({ acao: 'apagar', id: m.id })}
                />
              )}
              showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'mensagem' : 'mensagens'}`}
            />
          )}
        </div>
      )}

      {/* Modais de confirmação */}
      {confirmar?.acao === 'deletar' && (
        <Modal open onClose={() => setConfirmar(null)}>
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-preto">Excluir esta mensagem?</h3>
            <p className="text-sm text-grafite leading-relaxed">
              A mensagem ficará oculta da lista, mas pode ser restaurada na aba
              <strong className="text-text"> Excluídas</strong>.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmar(null)}
                className="px-4 py-2 text-sm font-medium text-grafite hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmar.id
                  setConfirmar(null)
                  executarDeletar(id)
                }}
                className="px-4 py-2 rounded-md bg-marrom text-white text-sm font-semibold hover:bg-marrom-escuro inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} strokeWidth={2} />
                Sim, excluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmar?.acao === 'apagar' && (
        <Modal open onClose={() => setConfirmar(null)}>
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-preto">Excluir permanentemente?</h3>
            <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertTriangle size={20} strokeWidth={1.8} className="text-red-700 shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 leading-relaxed">
                Esta ação <strong>não pode ser desfeita</strong>. A mensagem será apagada do banco pra sempre.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmar(null)}
                className="px-4 py-2 text-sm font-medium text-grafite hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmar.id
                  setConfirmar(null)
                  executarApagar(id)
                }}
                className="px-4 py-2 rounded-md bg-red-700 text-white text-sm font-semibold hover:bg-red-800 inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} strokeWidth={2} />
                Sim, apagar de vez
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md px-4 py-3 rounded-md shadow-lg text-sm font-medium animate-fade-in',
            toast.tipo === 'sucesso'
              ? 'bg-verde-musgo text-white'
              : 'bg-red-700 text-white',
          ].join(' ')}
        >
          {toast.texto}
        </div>
      )}
    </div>
  )
}

function AbaButton({
  ativa,
  onClick,
  label,
  contagem,
}: {
  ativa: boolean
  onClick: () => void
  label: string
  contagem: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative px-4 py-2.5 text-sm font-medium transition-colors',
        ativa ? 'text-marrom' : 'text-grafite hover:text-text',
      ].join(' ')}
    >
      {label} <span className="text-chumbo font-normal">({contagem})</span>
      {ativa && (
        <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-marrom rounded-full" />
      )}
    </button>
  )
}

function CardAtivo({
  mensagem,
  removendo,
  onMarcouLida,
  onDeletar,
}: {
  mensagem: ItemMensagem
  removendo: boolean
  onMarcouLida: (id: string) => void
  onDeletar: () => void
}) {
  const [marcando, startTransition] = useTransition()

  const handleMarcar = () => {
    startTransition(async () => {
      const res = await marcarMensagemComoLida(mensagem.id)
      if (res.ok) onMarcouLida(mensagem.id)
    })
  }

  const nome = mensagem.anonimo
    ? 'Anônimo'
    : mensagem.profissionais?.nome ?? 'Colaborador removido'

  return (
    <article
      className={[
        'card p-4 space-y-2 transition-all duration-200',
        !mensagem.lida ? 'border-l-4 border-l-marrom' : '',
        removendo ? 'opacity-0 translate-y-1' : 'opacity-100',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3 text-xs text-chumbo">
        <div className="flex items-center gap-2">
          {!mensagem.lida && (
            <span className="inline-block w-2 h-2 rounded-full bg-marrom" aria-label="Nova" />
          )}
          <span className="font-medium text-text inline-flex items-center gap-1">
            De: {nome}
            {mensagem.anonimo && (
              <Lock size={12} strokeWidth={1.5} className="text-marrom" aria-label="Anônimo" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <time dateTime={mensagem.created_at}>{tempoRelativo(mensagem.created_at)}</time>
        </div>
      </header>

      <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">{mensagem.conteudo}</p>

      <div className="flex items-center justify-between pt-1">
        {!mensagem.lida ? (
          <button
            type="button"
            onClick={handleMarcar}
            disabled={marcando}
            className="text-xs text-marrom hover:underline inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Check size={12} strokeWidth={2} />
            {marcando ? 'Marcando...' : 'Marcar como lida'}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onDeletar}
          className="text-xs text-chumbo hover:text-red-700 inline-flex items-center gap-1 transition-colors"
          aria-label="Excluir mensagem"
        >
          <Trash2 size={12} strokeWidth={1.5} />
          Excluir
        </button>
      </div>
    </article>
  )
}

function CardExcluido({
  mensagem,
  removendo,
  onRestaurar,
  onApagar,
}: {
  mensagem: ItemMensagem
  removendo: boolean
  onRestaurar: (id: string) => void
  onApagar: () => void
}) {
  const [acaoPending, startTransition] = useTransition()

  const nome = mensagem.anonimo
    ? 'Anônimo'
    : mensagem.profissionais?.nome ?? 'Colaborador removido'

  return (
    <article
      className={[
        'card p-4 space-y-2 transition-all duration-200 bg-linho/30',
        removendo ? 'opacity-0 translate-y-1' : 'opacity-100',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3 text-xs text-chumbo">
        <span className="font-medium text-text inline-flex items-center gap-1">
          De: {nome}
          {mensagem.anonimo && (
            <Lock size={12} strokeWidth={1.5} className="text-marrom" aria-label="Anônimo" />
          )}
        </span>
        <time className="shrink-0" dateTime={mensagem.created_at}>
          enviada {tempoRelativo(mensagem.created_at)}
        </time>
      </header>

      <p className="text-sm text-grafite whitespace-pre-wrap leading-relaxed">{mensagem.conteudo}</p>

      {mensagem.deletada_em && (
        <p className="text-xs text-chumbo italic">
          Deletada em {dataLonga(mensagem.deletada_em)}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 gap-3">
        <button
          type="button"
          onClick={() => startTransition(() => onRestaurar(mensagem.id))}
          disabled={acaoPending}
          className="text-xs text-marrom hover:underline inline-flex items-center gap-1 disabled:opacity-50"
        >
          <RotateCcw size={12} strokeWidth={2} />
          {acaoPending ? 'Restaurando...' : 'Restaurar'}
        </button>
        <button
          type="button"
          onClick={onApagar}
          className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
          aria-label="Apagar permanentemente"
        >
          <Trash2 size={12} strokeWidth={1.5} />
          Excluir permanentemente
        </button>
      </div>
    </article>
  )
}
