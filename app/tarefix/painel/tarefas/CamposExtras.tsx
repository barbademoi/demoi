'use client'

import { useState } from 'react'
import type { Categoria } from '@/lib/tarefix/tipos'
import { Rotulo } from '@/components/tarefix/ui'

/** Checklist (subitens) da tarefa — para qualquer colaborador. */
export function EditorChecklist({ itens, aoMudar }: { itens: string[]; aoMudar: (v: string[]) => void }) {
  const [novo, setNovo] = useState('')
  function adicionar() {
    const t = novo.trim().slice(0, 80)
    if (!t || itens.length >= 20) return
    aoMudar([...itens, t])
    setNovo('')
  }
  return (
    <div>
      <Rotulo
        dica={<p>Passos que a pessoa vai marcando dentro da tarefa. A tarefa continua valendo um check só; o checklist ajuda a não esquecer nenhuma parte.</p>}
        exemplo={<>“Fechar o caixa” → Dinheiro · Cartão · Pix · Bater com o sistema.</>}
      >
        Checklist (opcional)
      </Rotulo>
      {itens.length > 0 && (
        <ul className="mb-2 space-y-1">
          {itens.map((t, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl bg-tf-fundo px-3 py-2 text-sm">
              <span className="h-4 w-4 shrink-0 rounded border-2 border-tf-borda" aria-hidden />
              <span className="flex-1">{t}</span>
              <button type="button" className="h-8 w-8 rounded-full text-lg text-tf-suave hover:bg-tf-marca-clara" aria-label={`Remover ${t}`} onClick={() => aoMudar(itens.filter((_, j) => j !== i))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="tf-campo flex-1"
          placeholder="Ex.: Conferir o Pix"
          value={novo}
          maxLength={80}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              adicionar()
            }
          }}
          aria-label="Novo item do checklist"
        />
        <button type="button" className="tf-botao2 shrink-0 px-4" onClick={adicionar} disabled={!novo.trim() || itens.length >= 20}>
          + Item
        </button>
      </div>
    </div>
  )
}

/** Categoria (cor) — só no Meu dia. */
export function SeletorCategoria({ categorias, valor, aoMudar }: { categorias: Categoria[]; valor: string | null; aoMudar: (v: string | null) => void }) {
  if (categorias.length === 0) return null
  return (
    <div>
      <Rotulo dica={<p>Organiza o Meu dia por cor e permite filtrar a lista.</p>} exemplo={<>“Pagar o aluguel” em Finanças; “Treinar” em Saúde.</>}>
        Categoria
      </Rotulo>
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={valor === c.id}
            onClick={() => aoMudar(valor === c.id ? null : c.id)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 text-sm font-bold"
            style={valor === c.id ? { background: c.cor, borderColor: c.cor, color: '#fff' } : { borderColor: `${c.cor}66`, color: c.cor }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: valor === c.id ? '#fff' : c.cor }} aria-hidden />
            {c.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
