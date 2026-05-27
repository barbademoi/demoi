'use client'

import { useState, useTransition } from 'react'
import type { ConfigIA, TomIA } from '@/lib/iaPrompts'
import { salvarConfigIA, salvarVisibilidade, type VisibilidadeConfig } from './actions'

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

export default function ConfiguracoesClient({
  inicial,
  visInicial,
}: {
  inicial: ConfigIA
  visInicial: VisibilidadeConfig
}) {
  const [config, setConfig] = useState<ConfigIA>(inicial)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [vis, setVis] = useState<VisibilidadeConfig>(visInicial)
  const [feedbackVis, setFeedbackVis] = useState<string | null>(null)
  const [isPendingVis, startTransitionVis] = useTransition()

  function salvar() {
    setFeedback(null)
    startTransition(async () => {
      const res = await salvarConfigIA(config)
      setFeedback(res?.error ? res.error : 'Salvo ✓')
    })
  }

  function salvarVis() {
    setFeedbackVis(null)
    startTransitionVis(async () => {
      const res = await salvarVisibilidade(vis)
      setFeedbackVis(res?.error ? res.error : 'Salvo ✓')
    })
  }

  return (
    <>
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

    <div className="card p-5 space-y-5 mt-4">
      <div>
        <h2 className="font-semibold text-text">Visibilidade pra Equipe</h2>
        <p className="text-sm text-text-muted mt-1">
          Cada profissional tem um link com suas mensagens. Escolha o que ele enxerga.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border">
        <span className="text-sm text-text">
          Mostrar pontos a desenvolver
          <span className="block text-xs text-text-muted">Os feedbacks negativos aparecem pro profissional.</span>
        </span>
        <input
          type="checkbox"
          checked={vis.mostrar_negativos_profissional}
          onChange={(e) => setVis((v) => ({ ...v, mostrar_negativos_profissional: e.target.checked }))}
          className="accent-primary w-5 h-5 shrink-0"
        />
      </label>

      <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border">
        <span className="text-sm text-text">
          Mostrar observações
          <span className="block text-xs text-text-muted">As anotações de observação aparecem pro profissional.</span>
        </span>
        <input
          type="checkbox"
          checked={vis.mostrar_observacoes_profissional}
          onChange={(e) => setVis((v) => ({ ...v, mostrar_observacoes_profissional: e.target.checked }))}
          className="accent-primary w-5 h-5 shrink-0"
        />
      </label>

      <div className={`p-3 rounded-xl border border-border ${vis.mostrar_negativos_profissional ? '' : 'opacity-50'}`}>
        <label className="block text-sm text-text mb-1">Carência antes de mostrar um ponto a desenvolver</label>
        <p className="text-xs text-text-muted mb-2">
          Tempo pra você revisar, editar ou excluir antes do profissional ver.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={1440}
            value={vis.atraso_negativo_minutos}
            disabled={!vis.mostrar_negativos_profissional}
            onChange={(e) => setVis((v) => ({ ...v, atraso_negativo_minutos: Number(e.target.value) }))}
            className="input w-24"
          />
          <span className="text-sm text-text-muted">minutos</span>
        </div>
      </div>

      {feedbackVis && <p className="text-sm text-text-muted">{feedbackVis}</p>}

      <button type="button" onClick={salvarVis} disabled={isPendingVis} className="btn-primary w-full">
        {isPendingVis ? 'Salvando…' : 'Salvar visibilidade'}
      </button>
    </div>
    </>
  )
}
