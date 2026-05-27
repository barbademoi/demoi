'use client'

import { useState } from 'react'
import { tempoRelativo, dataLonga } from '@/lib/feedbacks'

export interface ItemElogio {
  id: string
  tipo: 'positivo' | 'negativo'
  texto: string
  categoria: string | null
  created_at: string
  lido_em: string | null
  resposta_profissional: string | null
}

const PAGINA = 20

function Tag({ tipo }: { tipo: 'positivo' | 'negativo' }) {
  if (tipo === 'negativo') {
    return <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">A desenvolver</span>
  }
  return <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Elogio</span>
}

function Card({ item, slug }: { item: ItemElogio; slug: string }) {
  const [lidoEm, setLidoEm] = useState<string | null>(item.lido_em)
  const [mostrarResp, setMostrarResp] = useState(false)
  const [resposta, setResposta] = useState('')
  const [respostaSalva, setRespostaSalva] = useState<string | null>(item.resposta_profissional)
  const [enviando, setEnviando] = useState(false)

  const podeConfirmar = item.tipo === 'positivo'
  const novo = podeConfirmar && !lidoEm

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
    <article className={`rounded-2xl border bg-surface p-4 animate-fade-in ${novo ? 'border-primary/40' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <Tag tipo={item.tipo} />
        <span className="text-xs text-text-muted">{tempoRelativo(item.created_at)}</span>
      </div>
      <p className="text-text text-[17px] leading-relaxed mt-2 whitespace-pre-wrap">{item.texto}</p>
      {item.categoria && (
        <span className="inline-block mt-2 text-xs text-text-muted border border-border rounded-full px-2 py-0.5">{item.categoria}</span>
      )}

      {respostaSalva && (
        <p className="text-sm text-text-muted italic mt-3 border-l-2 border-border pl-3">Sua resposta: {respostaSalva}</p>
      )}

      {podeConfirmar && !lidoEm && (
        <button
          type="button"
          onClick={() => confirmar()}
          disabled={enviando}
          className="btn-primary w-full mt-3 py-3 disabled:opacity-60"
        >
          {enviando ? 'Confirmando…' : 'Recebi ✓'}
        </button>
      )}

      {podeConfirmar && lidoEm && !respostaSalva && !mostrarResp && (
        <p className="text-xs text-text-muted mt-3">Você confirmou leitura em {dataLonga(lidoEm)}.</p>
      )}

      {mostrarResp && !respostaSalva && (
        <div className="mt-3 space-y-2 animate-fade-in">
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={2}
            placeholder="Quer responder algo? Não é obrigatório. Ex: Obrigado, fico feliz que notou!"
            className="input text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => confirmar(resposta)} disabled={enviando || !resposta.trim()} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60">
              Enviar resposta
            </button>
            <button type="button" onClick={() => setMostrarResp(false)} className="text-text-muted text-sm px-4">Pular</button>
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
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-text-muted">Ainda não há feedbacks registrados. Dê o seu melhor — cada atendimento é uma oportunidade.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {itens.slice(0, mostrar).map((e) => <Card key={e.id} item={e} slug={slug} />)}
      {mostrar < itens.length && (
        <button type="button" onClick={() => setMostrar((m) => m + PAGINA)} className="btn-secondary w-full py-3 text-sm">
          Ver mais
        </button>
      )}
    </div>
  )
}
