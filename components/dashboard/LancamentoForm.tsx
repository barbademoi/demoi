'use client'

import { useState, useTransition } from 'react'
import { lancarComissao } from '@/app/dashboard/actions'
import { formatBRL } from '@/lib/utils'
import type { Barbeiro, MetaIndividual } from '@/types/database'

interface Props {
  barbeiro: Barbeiro
  metaInd?: MetaIndividual
  comissaoAtual: number
}

export default function LancamentoForm({ barbeiro, metaInd, comissaoAtual }: Props) {
  const [modo, setModo] = useState<'direto' | 'calculado'>('direto')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  // Modo calculado
  const [fat, setFat] = useState('')
  const [percAss, setPercAss] = useState('')
  const [percServ, setPercServ] = useState('')
  const [percProd, setPercProd] = useState('')

  const comissaoCalculada =
    modo === 'calculado'
      ? (parseFloat(fat) || 0) *
        ((parseFloat(percAss) || 0) + (parseFloat(percServ) || 0) + (parseFloat(percProd) || 0)) /
        100
      : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)
    const fd = new FormData(e.currentTarget)

    if (modo === 'calculado' && comissaoCalculada !== null) {
      fd.set('comissao_acumulada', comissaoCalculada.toFixed(2))
    }

    startTransition(async () => {
      const res = await lancarComissao(fd)
      if (res && 'error' in res) {
        setErro(res.error ?? null)
      } else {
        setSucesso(true)
        setOpen(false)
        setTimeout(() => setSucesso(false), 3000)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title={comissaoAtual > 0 ? `Atualizar comissão (${formatBRL(comissaoAtual)})` : 'Lançar comissão'}
        className="text-text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
      >
        {sucesso ? (
          <span className="text-green-400 text-xs">✓</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        )}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-4">
      <input type="hidden" name="barbeiro_id" value={barbeiro.id} />
      <input type="hidden" name="modo" value={modo} />

      {/* Seletor de modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo('direto')}
          className={`flex-1 py-2 rounded-xl text-xs font-sans font-semibold transition-all
            ${modo === 'direto' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text'}`}
        >
          Comissão direta
        </button>
        <button
          type="button"
          onClick={() => setModo('calculado')}
          className={`flex-1 py-2 rounded-xl text-xs font-sans font-semibold transition-all
            ${modo === 'calculado' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text'}`}
        >
          Faturamento + %
        </button>
      </div>

      {modo === 'direto' ? (
        <div>
          <label className="label">Comissão acumulada (R$)</label>
          <input
            name="comissao_acumulada"
            type="number"
            step="0.01"
            min="0"
            defaultValue={comissaoAtual || ''}
            placeholder="0,00"
            required
            className="input"
          />
          {metaInd && (
            <p className="text-text-muted text-xs font-sans mt-1.5">
              Ouro: {formatBRL(metaInd.ouro_comm)} · Prata: {formatBRL(metaInd.prata_comm)} · Bronze: {formatBRL(metaInd.bronze_comm)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">Faturamento total (R$)</label>
            <input
              name="faturamento"
              type="number" step="0.01" min="0"
              value={fat} onChange={e => setFat(e.target.value)}
              placeholder="0,00" className="input"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">% Assin.</label>
              <input name="perc_assinatura" type="number" step="0.1" min="0" max="100"
                value={percAss} onChange={e => setPercAss(e.target.value)}
                placeholder="0" className="input text-center" />
            </div>
            <div>
              <label className="label">% Serviço</label>
              <input name="perc_servico" type="number" step="0.1" min="0" max="100"
                value={percServ} onChange={e => setPercServ(e.target.value)}
                placeholder="0" className="input text-center" />
            </div>
            <div>
              <label className="label">% Produto</label>
              <input name="perc_produto" type="number" step="0.1" min="0" max="100"
                value={percProd} onChange={e => setPercProd(e.target.value)}
                placeholder="0" className="input text-center" />
            </div>
          </div>
          {comissaoCalculada !== null && comissaoCalculada > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-center">
              <p className="text-text-muted text-xs font-sans">Comissão calculada</p>
              <p className="font-serif text-2xl text-text">{formatBRL(comissaoCalculada)}</p>
            </div>
          )}
        </div>
      )}

      {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm py-2">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm py-2">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

