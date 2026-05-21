'use client'

import { formatBRL } from '@/lib/utils'

interface HistoricoEntry {
  mes: number
  ano: number
  comissao: number
  atendimentos: number
  label: string
}

interface Props {
  historico: HistoricoEntry[]
  variant?: 'dark' | 'light'
  escopo?: 'individual' | 'coletivo'
}

function ticket(entry: HistoricoEntry): number | null {
  if (entry.atendimentos <= 0) return null
  return entry.comissao / entry.atendimentos
}

export default function TicketMedio({ historico, variant = 'dark', escopo = 'individual' }: Props) {
  // Esconde se nenhum mês tem atendimentos (dono nunca preencheu o campo)
  if (!historico.some(h => h.atendimentos > 0)) return null

  const atual = historico[historico.length - 1]
  const ticketAtual = ticket(atual)
  const isDark = variant === 'dark'
  const isColetivo = escopo === 'coletivo'

  const cardCls = isDark ? 'card p-5 space-y-4' : 'card-light p-5 space-y-4'
  const titleCls = isDark ? 'text-text-muted text-xs font-sans uppercase tracking-wide' : 'text-on-cream-muted text-xs font-sans uppercase tracking-wide'
  const bigValueCls = isDark ? 'font-serif text-4xl text-text' : 'font-serif text-4xl text-on-cream'
  const subValueCls = isDark ? 'text-text-muted text-sm font-sans' : 'text-on-cream-muted text-sm font-sans'
  const labelCls = isDark ? 'text-text-muted text-[11px] font-sans' : 'text-on-cream-muted text-[11px] font-sans'
  const monthValueCls = isDark ? 'text-text text-sm font-sans font-semibold' : 'text-on-cream text-sm font-sans font-semibold'
  const dividerCls = isDark ? 'border-border' : 'border-cream-border'

  return (
    <div className={cardCls}>
      <p className={titleCls}>{isColetivo ? 'Ticket médio da barbearia' : 'Ticket médio'}</p>

      {/* Hero — ticket do mês atual */}
      <div className="text-center space-y-1">
        {ticketAtual !== null ? (
          <>
            <p className={bigValueCls}>{formatBRL(ticketAtual)}</p>
            <p className={subValueCls}>
              {atual.atendimentos} {atual.atendimentos === 1 ? 'atendimento' : 'atendimentos'}
              {isColetivo ? ' da equipe' : ''} em {atual.label}
            </p>
          </>
        ) : (
          <>
            <p className={bigValueCls}>—</p>
            <p className={subValueCls}>
              {isColetivo
                ? 'Preencha "Atendimentos no mês" de cada barbeiro pra ver o ticket médio da barbearia.'
                : 'Preencha "Atendimentos no mês" ao lançar a comissão pra ver seu ticket médio.'}
            </p>
          </>
        )}
      </div>

      {/* Evolução mês a mês */}
      {historico.length > 1 && (
        <div className={`pt-3 border-t ${dividerCls}`}>
          <p className={`${labelCls} uppercase tracking-wide mb-2`}>Evolução</p>
          <div className="flex justify-between gap-2">
            {historico.map(h => {
              const t = ticket(h)
              return (
                <div key={`${h.ano}-${h.mes}`} className="flex-1 text-center min-w-0">
                  <p className={`${monthValueCls} truncate`}>
                    {t !== null ? formatBRL(t).replace('R$ ', '') : '—'}
                  </p>
                  <p className={`${labelCls} truncate`}>{h.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
