'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Lock } from 'lucide-react'
import { ListExpander } from '@/components/ui/ListExpander'
import { marcarMensagemComoLida } from '@/app/p/[slug]/actions'

export interface ItemMensagem {
  id: string
  colaborador_id: string | null
  conteudo: string
  anonimo: boolean
  lida: boolean
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

export function MensagensClient({ itens: itensIniciais }: { itens: ItemMensagem[] }) {
  const [itens, setItens] = useState(itensIniciais)
  const router = useRouter()

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

  const naoLidas = itens.filter((m) => !m.lida)
  const lidas = itens.filter((m) => m.lida)

  return (
    <div className="space-y-6">
      {naoLidas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text">
            Novas <span className="text-chumbo font-normal">· {naoLidas.length}</span>
          </h2>
          <ListExpander
            items={naoLidas}
            initialCount={5}
            renderItem={(m) => (
              <Card mensagem={m} onMarcouLida={(id) => setItens((arr) => arr.map((x) => x.id === id ? { ...x, lida: true } : x))} router={router} />
            )}
            showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'mensagem' : 'mensagens'}`}
          />
        </section>
      )}

      {lidas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-chumbo">
            Lidas <span className="font-normal">· {lidas.length}</span>
          </h2>
          <ListExpander
            items={lidas}
            initialCount={5}
            renderItem={(m) => (
              <Card mensagem={m} onMarcouLida={() => { /* já lida */ }} router={router} />
            )}
            showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'mensagem' : 'mensagens'}`}
          />
        </section>
      )}
    </div>
  )
}

function Card({
  mensagem,
  onMarcouLida,
  router,
}: {
  mensagem: ItemMensagem
  onMarcouLida: (id: string) => void
  router: ReturnType<typeof useRouter>
}) {
  const [marcando, startTransition] = useTransition()

  const handleMarcar = () => {
    startTransition(async () => {
      const res = await marcarMensagemComoLida(mensagem.id)
      if (res.ok) {
        onMarcouLida(mensagem.id)
        router.refresh()
      }
    })
  }

  const nome = mensagem.anonimo
    ? 'Anônimo'
    : mensagem.profissionais?.nome ?? 'Colaborador removido'

  return (
    <article
      className={[
        'card p-4 space-y-2',
        !mensagem.lida ? 'border-l-4 border-l-marrom' : '',
      ].join(' ')}
    >
      <header className="flex items-center justify-between text-xs text-chumbo">
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
        <time dateTime={mensagem.created_at}>{tempoRelativo(mensagem.created_at)}</time>
      </header>

      <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">{mensagem.conteudo}</p>

      {!mensagem.lida && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleMarcar}
            disabled={marcando}
            className="text-xs text-marrom hover:underline inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Check size={12} strokeWidth={2} />
            {marcando ? 'Marcando...' : 'Marcar como lida'}
          </button>
        </div>
      )}
    </article>
  )
}
