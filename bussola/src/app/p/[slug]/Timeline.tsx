'use client'

import { useState } from 'react'
import { Check, CheckCircle2 } from 'lucide-react'
import { tempoRelativo, dataLonga } from '@/lib/feedbacks'

export interface ItemElogio {
  id: string
  texto: string
  categoria: string | null
  created_at: string
  lido_em: string | null
  resposta_profissional: string | null
  resposta_em: string | null
  visivel_profissional_em: string | null
}

const PAGINA = 20

function Card({ item, slug }: { item: ItemElogio; slug: string }) {
  const [lidoEm, setLidoEm] = useState<string | null>(item.lido_em)
  const [mostrarResp, setMostrarResp] = useState(false)
  const [resposta, setResposta] = useState('')
  const [respostaSalva, setRespostaSalva] = useState<string | null>(item.resposta_profissional)
  const [enviando, setEnviando] = useState(false)

  async function confirmar(respostaTexto?: string) {
    setEnviando(true)
    try {
      const r = await fetch(`/api/feedback/${item.id}/confirmar-leitura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, resposta_opcional: respostaTexto }),
      })
      const j = await r.json()
      if (r.ok) {
        setLidoEm(j.lido_em)
        if (j.resposta) setRespostaSalva(j.resposta)
        if (respostaTexto !== undefined) setMostrarResp(false)
        else setMostrarResp(true)
      }
    } catch {
      /* ignore */
    }
    setEnviando(false)
  }

  return (
    <article className="rounded-lg border border-border bg-surface p-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-chumbo">{tempoRelativo(item.created_at)}</span>
        {item.categoria && (
          <span className="text-xs text-chumbo border border-border rounded-full px-2 py-0.5">{item.categoria}</span>
        )}
      </div>
      <p className="text-text text-[15px] leading-relaxed mt-2 whitespace-pre-wrap">{item.texto}</p>

      {respostaSalva && (
        <p className="text-sm text-grafite italic mt-3 border-l-2 border-border pl-3">Sua resposta: {respostaSalva}</p>
      )}

      {!lidoEm && (
        <button
          type="button"
          onClick={() => confirmar()}
          disabled={enviando}
          className="btn-secondary w-full mt-3 disabled:opacity-60"
        >
          <Check size={18} strokeWidth={1.5} />
          {enviando ? 'Confirmando…' : 'Recebi'}
        </button>
      )}

      {lidoEm && !respostaSalva && !mostrarResp && (
        <p className="inline-flex items-center gap-1.5 text-xs text-verde-musgo mt-3">
          <CheckCircle2 size={14} strokeWidth={1.5} />
          Você confirmou leitura em {dataLonga(lidoEm)}.
        </p>
      )}

      {mostrarResp && !respostaSalva && (
        <div className="mt-3 space-y-2 animate-fade-in">
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={2}
            placeholder="Quer responder algo? Não é obrigatório."
            className="input text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => confirmar(resposta)} disabled={enviando || !resposta.trim()} className="btn-primary flex-1 disabled:opacity-60">
              Enviar resposta
            </button>
            <button type="button" onClick={() => setMostrarResp(false)} className="text-grafite text-sm px-4">Pular</button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function Timeline({ itens, slug }: { itens: ItemElogio[]; slug: string }) {
  const [mostrar, setMostrar] = useState(PAGINA)

  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-grafite">Ainda não há anotações. Continue dando o seu melhor — cada dia conta.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {itens.slice(0, mostrar).map((e) => <Card key={e.id} item={e} slug={slug} />)}
      {mostrar < itens.length && (
        <button type="button" onClick={() => setMostrar((m) => m + PAGINA)} className="btn-secondary w-full text-sm">
          Ver mais
        </button>
      )}
    </div>
  )
}
