'use client'

import { useState, useTransition } from 'react'
import { salvarOperacaoConfig } from './actions'

const DIAS_CONFIG = [
  { key: 'segunda', label: 'Seg' },
  { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' },
  { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' },
  { key: 'sabado',  label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
]

interface BarbeariaData {
  dias_trabalhados: { dia: string; ativo: boolean }[] | null
  horario_abertura: string | null
  horario_fechamento: string | null
  modalidade: string | null
  tem_assinatura: boolean | null
}

export default function OperacaoTab({ barbearia }: { barbearia: BarbeariaData }) {
  const diasSalvos = barbearia.dias_trabalhados
  const [diasAtivos, setDiasAtivos] = useState<Set<string>>(
    new Set(diasSalvos ? diasSalvos.filter(d => d.ativo).map(d => d.dia) : ['terca', 'quarta', 'quinta', 'sexta', 'sabado'])
  )
  const [modalidade, setModalidade] = useState(barbearia.modalidade ?? 'equipe')
  const [temAssinatura, setTemAssinatura] = useState(barbearia.tem_assinatura ?? false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleDia(dia: string) {
    setDiasAtivos(prev => { const n = new Set(prev); n.has(dia) ? n.delete(dia) : n.add(dia); return n })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null); setSucesso(false)
    const formData = new FormData(e.currentTarget)
    DIAS_CONFIG.forEach(({ key }) => {
      if (diasAtivos.has(key)) formData.set(`dia_${key}`, 'on')
      else formData.delete(`dia_${key}`)
    })
    startTransition(async () => {
      const result = await salvarOperacaoConfig(formData)
      if (result?.error) setErro(result.error)
      else setSucesso(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label">Dias trabalhados</label>
        <div className="flex gap-1.5 flex-wrap">
          {DIAS_CONFIG.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => toggleDia(key)}
              className={['w-10 h-10 rounded-lg text-xs font-semibold font-sans border transition-all',
                diasAtivos.has(key) ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-text-muted hover:border-primary/40',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="horario_abertura" className="label">Abertura</label>
          <input id="horario_abertura" name="horario_abertura" type="time"
            defaultValue={barbearia.horario_abertura?.slice(0, 5) ?? '09:00'} className="input" />
        </div>
        <div>
          <label htmlFor="horario_fechamento" className="label">Fechamento</label>
          <input id="horario_fechamento" name="horario_fechamento" type="time"
            defaultValue={barbearia.horario_fechamento?.slice(0, 5) ?? '20:00'} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Modalidade</label>
        <div className="grid grid-cols-2 gap-3">
          {(['sozinho', 'equipe'] as const).map(op => (
            <label key={op} className={['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              modalidade === op ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40'].join(' ')}>
              <input type="radio" name="modalidade" value={op} checked={modalidade === op}
                onChange={() => setModalidade(op)} className="hidden" />
              <div className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                modalidade === op ? 'border-primary' : 'border-border'].join(' ')}>
                {modalidade === op && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm font-sans text-text">{op === 'sozinho' ? 'Sozinho' : 'Com equipe'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Clube de assinatura?</label>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map(val => (
            <label key={String(val)} className={['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              temAssinatura === val ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40'].join(' ')}>
              <input type="radio" name="tem_assinatura" value={String(val)} checked={temAssinatura === val}
                onChange={() => setTemAssinatura(val)} className="hidden" />
              <div className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                temAssinatura === val ? 'border-primary' : 'border-border'].join(' ')}>
                {temAssinatura === val && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm font-sans text-text">{val ? 'Sim' : 'Não'}</span>
            </label>
          ))}
        </div>
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
      {sucesso && <p className="text-green-400 text-sm font-sans">Salvo com sucesso!</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}
