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
  visibilidade_ranking: 'completo' | 'posicoes' | 'proprio' | null
  dia_fechamento: number | null
  mostrar_ticket_medio: boolean | null
}

type VisibilidadeRanking = 'completo' | 'posicoes' | 'proprio'

const VISIBILIDADE_OPCOES: { value: VisibilidadeRanking; titulo: string; descricao: string }[] = [
  {
    value: 'completo',
    titulo: 'Ranking completo',
    descricao: 'Barbeiro vê posição + valores de todos.',
  },
  {
    value: 'posicoes',
    titulo: 'Só posições',
    descricao: 'Barbeiro vê 1º, 2º, 3º… mas não vê o valor dos colegas.',
  },
  {
    value: 'proprio',
    titulo: 'Só o próprio progresso',
    descricao: 'Barbeiro vê só suas metas e progresso. Não vê ranking nem valores dos colegas.',
  },
]

export default function OperacaoTab({ barbearia }: { barbearia: BarbeariaData }) {
  const diasSalvos = barbearia.dias_trabalhados
  const [diasAtivos, setDiasAtivos] = useState<Set<string>>(
    new Set(diasSalvos ? diasSalvos.filter(d => d.ativo).map(d => d.dia) : ['terca', 'quarta', 'quinta', 'sexta', 'sabado'])
  )
  const [modalidade, setModalidade] = useState(barbearia.modalidade ?? 'equipe')
  const [temAssinatura, setTemAssinatura] = useState(barbearia.tem_assinatura ?? false)
  const [visibilidade, setVisibilidade] = useState<VisibilidadeRanking>(
    barbearia.visibilidade_ranking ?? 'completo'
  )
  const [diaFechamento, setDiaFechamento] = useState<string>(String(barbearia.dia_fechamento ?? 1))
  const [mostrarTicket, setMostrarTicket] = useState<boolean>(barbearia.mostrar_ticket_medio ?? false)
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
    formData.set('mostrar_ticket_medio', mostrarTicket ? 'true' : 'false')
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
        <label htmlFor="dia_fechamento" className="label">Dia de fechamento do mês</label>
        <p className="text-text-muted text-xs font-sans mb-2 leading-relaxed">Quando seu mês começa?</p>
        <div className="flex items-center gap-3">
          <input
            id="dia_fechamento"
            name="dia_fechamento"
            type="number"
            min="1"
            max="28"
            value={diaFechamento}
            onChange={e => setDiaFechamento(e.target.value)}
            className="input w-24"
          />
          <p className="text-text-muted text-xs font-sans leading-relaxed flex-1">
            {diaFechamento === '1'
              ? 'Mês calendário (dia 1 ao fim do mês).'
              : `Ciclo do dia ${diaFechamento} ao dia ${Math.max(1, (parseInt(diaFechamento) || 1) - 1)} do mês seguinte.`}
          </p>
        </div>
        <p className="text-text-muted text-[11px] font-sans mt-2 leading-relaxed">
          Aceita de 1 a 28. <span className="text-amber-500">⚠️ Não mude no meio do mês</span> — pode deslocar dados já lançados.
        </p>
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

      <div>
        <label className="label">Visibilidade do ranking para os barbeiros</label>
        <p className="text-text-muted text-xs font-sans mb-3 leading-relaxed">
          Define o que cada barbeiro enxerga ao abrir o link individual dele.
        </p>
        {/* Valor enviado no submit — fonte única de verdade (estado React).
            À prova de falhas: não depende do `checked` dos radios visuais. */}
        <input type="hidden" name="visibilidade_ranking" value={visibilidade} />
        <div className="space-y-2">
          {VISIBILIDADE_OPCOES.map(op => (
            <label key={op.value} className={['flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
              visibilidade === op.value ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40'].join(' ')}>
              <input type="radio" name="visibilidade_ranking_radio" value={op.value} checked={visibilidade === op.value}
                onChange={() => setVisibilidade(op.value)} className="hidden" />
              <div className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                visibilidade === op.value ? 'border-primary' : 'border-border'].join(' ')}>
                {visibilidade === op.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-semibold text-text leading-snug">{op.titulo}</p>
                <p className="text-xs font-sans text-text-muted leading-relaxed mt-0.5">{op.descricao}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Exibição de ticket médio</label>
        <p className="text-text-muted text-xs font-sans mb-3 leading-relaxed">
          Mostrar o ticket médio (faturamento ÷ atendimentos) no dashboard, na tela do barbeiro e nos cards. Quem não quiser, deixa desligado.
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={mostrarTicket}
          onClick={() => setMostrarTicket(v => !v)}
          className={[
            'flex items-center gap-3 w-full p-3.5 rounded-xl border cursor-pointer transition-all text-left',
            mostrarTicket ? 'border-primary bg-primary/5' : 'border-border bg-surface-2 hover:border-primary/40',
          ].join(' ')}
        >
          <span
            className={[
              'relative w-10 h-6 rounded-full transition-colors shrink-0',
              mostrarTicket ? 'bg-primary' : 'bg-surface',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                mostrarTicket ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')}
            />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans font-semibold text-text leading-snug">
              {mostrarTicket ? 'Mostrar ticket médio' : 'Não mostrar ticket médio'}
            </p>
            <p className="text-xs font-sans text-text-muted leading-relaxed mt-0.5">
              {mostrarTicket
                ? 'Aparece no dashboard, no card do barbeiro, na tela individual e nos cards PNG.'
                : 'Fica oculto pra você e pros barbeiros.'}
            </p>
          </div>
        </button>
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
      {sucesso && <p className="text-green-400 text-sm font-sans">Salvo com sucesso!</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}
