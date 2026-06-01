'use client'

import { useState, useTransition } from 'react'
import { Sun, Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react'
import Modal from '@/components/Modal'
import type { Cadencia } from '@/lib/cadencia'
import { salvarCadencia } from './cadenciaActions'

interface Props {
  inicial: {
    cadencia: Cadencia
    dia_reuniao: number | null
    hora_reuniao: string
    dia_mes_reuniao: number | null
    incluir_domingos: boolean
  }
}

const DIAS_SEMANA = [
  { v: 1, label: 'Segunda' }, { v: 2, label: 'Terça' }, { v: 3, label: 'Quarta' },
  { v: 4, label: 'Quinta' }, { v: 5, label: 'Sexta' }, { v: 6, label: 'Sábado' },
  { v: 7, label: 'Domingo' },
]

const OPCOES: { v: Cadencia; label: string; sub: string; icon: typeof Sun }[] = [
  { v: 'diaria', label: 'Diária', sub: 'todo dia útil', icon: Sun },
  { v: 'semanal', label: 'Semanal (recomendado)', sub: 'um dia fixo da semana', icon: Calendar },
  { v: 'quinzenal', label: 'Quinzenal', sub: 'a cada 2 semanas', icon: CalendarDays },
  { v: 'mensal', label: 'Mensal', sub: 'uma vez por mês', icon: CalendarRange },
]

export default function CadenciaSection({ inicial }: Props) {
  const [cadencia, setCadencia] = useState<Cadencia>(inicial.cadencia)
  const [diaSemana, setDiaSemana] = useState<number>(inicial.dia_reuniao ?? 1)
  const [hora, setHora] = useState<string>(inicial.hora_reuniao || '09:00')
  const [diaMes, setDiaMes] = useState<number>(inicial.dia_mes_reuniao ?? 1)
  const [incluirDom, setIncluirDom] = useState<boolean>(inicial.incluir_domingos)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [confirmar, setConfirmar] = useState<null | 'salvar'>(null)
  const [isPending, startTransition] = useTransition()

  const mudouCadencia = cadencia !== inicial.cadencia

  function tentarSalvar() {
    if (mudouCadencia) {
      setConfirmar('salvar')
    } else {
      salvar()
    }
  }

  function salvar() {
    setErro(null)
    setSucesso(false)
    startTransition(async () => {
      const r = await salvarCadencia({
        cadencia,
        dia_reuniao: diaSemana,
        hora_reuniao: hora,
        dia_mes_reuniao: diaMes,
        incluir_domingos: incluirDom,
      })
      if (r?.error) setErro(r.error)
      else {
        setSucesso(true)
        setConfirmar(null)
      }
    })
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <Clock size={20} strokeWidth={1.5} color="#8B6F47" /> Cadência das reuniões
        </h2>
        <p className="text-sm text-chumbo mt-1">
          Quando sua equipe se encontra pra alinhar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPCOES.map((o) => {
          const Icon = o.icon
          const on = cadencia === o.v
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => setCadencia(o.v)}
              className={`text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                on ? 'border-marrom bg-linho/40' : 'border-border hover:bg-linho/30'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} color={on ? '#8B6F47' : '#8A8A8A'} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${on ? 'text-marrom' : 'text-text'}`}>{o.label}</p>
                <p className="text-xs text-chumbo">{o.sub}</p>
              </div>
            </button>
          )
        })}
      </div>

      {cadencia === 'diaria' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-chumbo font-medium">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input mt-1 w-40" />
            <p className="text-xs text-chumbo mt-1">
              Acontece todo dia {incluirDom ? '' : 'útil (segunda a sábado)'}.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={incluirDom}
              onChange={(e) => setIncluirDom(e.target.checked)}
              className="w-4 h-4 accent-marrom"
            />
            Incluir domingos
          </label>
        </div>
      )}

      {(cadencia === 'semanal' || cadencia === 'quinzenal') && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-chumbo font-medium">Dia da semana</label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(parseInt(e.target.value, 10))}
              className="input mt-1"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.v} value={d.v}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input mt-1 w-40" />
          </div>
          {cadencia === 'quinzenal' && (
            <p className="text-xs text-chumbo">
              A reunião acontece a cada 2 semanas a partir da próxima {DIAS_SEMANA.find((d) => d.v === diaSemana)?.label.toLowerCase()}.
            </p>
          )}
        </div>
      )}

      {cadencia === 'mensal' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-chumbo font-medium">Dia do mês (1 a 31)</label>
            <input
              type="number"
              min={1}
              max={31}
              value={diaMes}
              onChange={(e) => setDiaMes(Math.max(1, Math.min(31, parseInt(e.target.value || '1', 10))))}
              className="input mt-1 w-32"
            />
            <p className="text-xs text-chumbo mt-1">
              Se o dia não existir no mês (ex: 31 em fevereiro), reunião acontece no último dia do mês.
            </p>
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input mt-1 w-40" />
          </div>
        </div>
      )}

      {erro && <p className="text-sm text-vinho">{erro}</p>}
      {sucesso && <p className="text-sm text-verde-musgo">Salvo.</p>}

      <button type="button" onClick={tentarSalvar} disabled={isPending} className="btn-primary w-full disabled:opacity-60">
        {isPending ? 'Salvando…' : 'Salvar cadência'}
      </button>

      <Modal open={confirmar === 'salvar'} onClose={() => !isPending && setConfirmar(null)}>
        <div className="p-5">
          <h3 className="font-semibold text-text">Mudar cadência?</h3>
          <p className="text-sm text-grafite mt-2">
            Esta mudança afeta as próximas reuniões. Reuniões já agendadas mantêm a data.
          </p>
          <div className="flex gap-2 mt-5">
            <button type="button" onClick={salvar} disabled={isPending} className="btn-primary flex-1 disabled:opacity-60">
              {isPending ? 'Salvando…' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setConfirmar(null)} className="text-grafite px-4">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
