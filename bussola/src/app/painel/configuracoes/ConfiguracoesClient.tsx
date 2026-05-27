'use client'

import { useState, useTransition } from 'react'
import type { ConfigIA, TomIA } from '@/lib/iaPrompts'
import { salvarConfigIA } from './actions'

const TONS: { v: TomIA; label: string; desc: string }[] = [
  { v: 'direto', label: 'Direto', desc: 'Sem rodeio, ao ponto.' },
  { v: 'acolhedor', label: 'Acolhedor', desc: 'Empático, mais suave.' },
  { v: 'motivacional', label: 'Motivacional', desc: 'Energético, puxa pra cima.' },
]

const TOGGLES: { chave: keyof Omit<ConfigIA, 'tom'>; label: string }[] = [
  { chave: 'categorizacao_auto', label: 'Categorização automática de feedbacks' },
  { chave: 'resumo_semana', label: 'Resumo da semana pela IA (na reunião)' },
  { chave: 'dicas_blocos', label: 'Dicas de liderança nos blocos da reunião' },
]

export default function ConfiguracoesClient({ inicial }: { inicial: ConfigIA }) {
  const [config, setConfig] = useState<ConfigIA>(inicial)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    setFeedback(null)
    startTransition(async () => {
      const res = await salvarConfigIA(config)
      setFeedback(res?.error ? res.error : 'Salvo ✓')
    })
  }

  return (
    <div className="card p-5 space-y-6">
      <h2 className="font-semibold text-text">Inteligência Artificial</h2>

      <div>
        <label className="label">Tom das sugestões</label>
        <div className="space-y-2">
          {TONS.map((t) => (
            <label
              key={t.v}
              className={[
                'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                config.tom === t.v ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40',
              ].join(' ')}
            >
              <input type="radio" checked={config.tom === t.v} onChange={() => setConfig((c) => ({ ...c, tom: t.v }))} className="accent-primary mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-text">{t.label}</span>
                <span className="block text-xs text-text-muted">{t.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {TOGGLES.map((t) => (
          <label key={t.chave} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border">
            <span className="text-sm text-text">{t.label}</span>
            <input
              type="checkbox"
              checked={config[t.chave]}
              onChange={(e) => setConfig((c) => ({ ...c, [t.chave]: e.target.checked }))}
              className="accent-primary w-5 h-5"
            />
          </label>
        ))}
      </div>

      {feedback && <p className="text-sm text-text-muted">{feedback}</p>}

      <button type="button" onClick={salvar} disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </div>
  )
}
