'use client'

import { useState, useTransition } from 'react'
import { lancarComissao } from '@/app/dashboard/actions'
import { formatBRL } from '@/lib/utils'
import type { Barbeiro, MetaIndividual } from '@/types/database'

interface SharedProps {
  barbeiro: Barbeiro
  metaInd?: MetaIndividual
  comissaoAtual: number
  // Quando true, o form mostra também o campo "Atendimentos no mês" (usado pra ticket médio)
  isAutonomo?: boolean
  atendimentosAtuais?: number
}

// ── Trigger (botão lápis) ─────────────────────────────────────

interface TriggerProps {
  sucesso?: boolean
  comissaoAtual: number
  onClick: () => void
  className?: string
}

export function LancamentoFormTrigger({ sucesso, comissaoAtual, onClick, className = '' }: TriggerProps) {
  return (
    <button
      onClick={onClick}
      title={comissaoAtual > 0 ? `Atualizar comissão (${formatBRL(comissaoAtual)})` : 'Lançar comissão'}
      aria-label="Lançar ou atualizar comissão"
      className={`text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10 ${className}`}
    >
      {sucesso ? (
        <span className="text-green-400 text-xs">✓</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      )}
    </button>
  )
}

// ── Body (form expandido) ─────────────────────────────────────

interface BodyProps extends SharedProps {
  onClose: () => void
  onSuccess?: () => void
}

export function LancamentoFormBody({ barbeiro, metaInd, comissaoAtual, isAutonomo, atendimentosAtuais, onClose, onSuccess }: BodyProps) {
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await lancarComissao(fd)
      if (res && 'error' in res) {
        setErro(res.error ?? null)
      } else {
        onSuccess?.()
        onClose()
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-border space-y-4 text-left"
    >
      <input type="hidden" name="barbeiro_id" value={barbeiro.id} />

      <div>
        <label className="label">Comissão do mês (R$)</label>
        <input
          name="comissao_acumulada"
          type="number"
          step="0.01"
          min="0"
          defaultValue={comissaoAtual || ''}
          placeholder="0,00"
          required
          autoFocus
          className="input w-full"
        />
        <p className="block text-text-muted text-[11px] sm:text-xs font-sans mt-1.5 leading-snug">
          Digite o total de comissão que esse barbeiro recebeu no mês.
        </p>
        {metaInd && (
          <p className="block text-text-muted text-[11px] sm:text-xs font-sans mt-2 leading-snug">
            Ouro: {formatBRL(metaInd.ouro_comm)} · Prata: {formatBRL(metaInd.prata_comm)} · Bronze: {formatBRL(metaInd.bronze_comm)}
          </p>
        )}
      </div>

      {/* Atendimentos do mês — só no modo autônomo (alimenta o ticket médio) */}
      {isAutonomo && (
        <div>
          <label className="label">Atendimentos no mês</label>
          <input
            name="numero_atendimentos"
            type="number"
            step="1"
            min="0"
            defaultValue={atendimentosAtuais && atendimentosAtuais > 0 ? atendimentosAtuais : ''}
            placeholder="0"
            className="input w-full"
          />
          <p className="block text-text-muted text-[11px] sm:text-xs font-sans mt-1.5 leading-snug">
            Quantos cortes/atendimentos você fez no mês. Usado pra calcular seu ticket médio.
          </p>
        </div>
      )}

      {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className="btn-ghost text-sm py-2.5">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary text-sm py-2.5">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

// ── Wrapper (back-compat: bundles trigger + body with internal state) ─

export default function LancamentoForm({ barbeiro, metaInd, comissaoAtual, isAutonomo, atendimentosAtuais }: SharedProps) {
  const [open, setOpen] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  if (!open) {
    return (
      <LancamentoFormTrigger
        comissaoAtual={comissaoAtual}
        sucesso={sucesso}
        onClick={() => setOpen(true)}
      />
    )
  }

  return (
    <LancamentoFormBody
      barbeiro={barbeiro}
      metaInd={metaInd}
      comissaoAtual={comissaoAtual}
      isAutonomo={isAutonomo}
      atendimentosAtuais={atendimentosAtuais}
      onClose={() => setOpen(false)}
      onSuccess={() => {
        setSucesso(true)
        setTimeout(() => setSucesso(false), 3000)
      }}
    />
  )
}
