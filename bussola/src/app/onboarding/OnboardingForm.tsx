'use client'

import { useState, useTransition } from 'react'
import { criarEstabelecimento } from './actions'

const DIAS = [
  { valor: 1, label: 'Segunda-feira' },
  { valor: 2, label: 'Terça-feira' },
  { valor: 3, label: 'Quarta-feira' },
  { valor: 4, label: 'Quinta-feira' },
  { valor: 5, label: 'Sexta-feira' },
  { valor: 6, label: 'Sábado' },
]

const SETORES = [
  'Barbearia / Salão',
  'Restaurante / Bar',
  'Loja / Comércio',
  'Oficina / Serviço técnico',
  'Escritório (advocacia, contabilidade, etc.)',
  'Agência / Criativo',
  'Clínica / Saúde',
  'Outro',
]

const TAMANHOS = [
  { v: '1-5', label: '1 a 5 pessoas' },
  { v: '6-15', label: '6 a 15 pessoas' },
  { v: '16-30', label: '16 a 30 pessoas' },
  { v: '30+', label: 'Mais de 30 pessoas' },
]

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await criarEstabelecimento(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nome" className="label">Nome da empresa</label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          placeholder="Ex.: Casa do João"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="setor" className="label">Setor <span className="text-chumbo font-normal">(opcional)</span></label>
        <select id="setor" name="setor" defaultValue="" className="input">
          <option value="">Selecione…</option>
          {SETORES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tamanho_equipe" className="label">Tamanho da equipe <span className="text-chumbo font-normal">(opcional)</span></label>
        <select id="tamanho_equipe" name="tamanho_equipe" defaultValue="" className="input">
          <option value="">Selecione…</option>
          {TAMANHOS.map((t) => (
            <option key={t.v} value={t.v}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="endereco" className="label">Endereço <span className="text-chumbo font-normal">(opcional)</span></label>
        <input
          id="endereco"
          name="endereco"
          type="text"
          placeholder="Rua, número, bairro"
          className="input"
        />
      </div>

      <div>
        <label className="label">Cadência das reuniões</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { v: 'diaria', label: 'Diária' },
            { v: 'semanal', label: 'Semanal' },
            { v: 'quinzenal', label: 'Quinzenal' },
            { v: 'mensal', label: 'Mensal' },
          ] as { v: string; label: string }[]).map((c) => (
            <label key={c.v} className="flex items-center gap-2 rounded-md border border-border p-3 cursor-pointer has-[:checked]:border-marrom has-[:checked]:bg-linho/40">
              <input
                type="radio"
                name="cadencia_reuniao"
                value={c.v}
                defaultChecked={c.v === 'semanal'}
                className="accent-marrom"
              />
              <span className="text-sm text-text">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="dia_reuniao" className="label">Dia da semana <span className="text-chumbo font-normal">(semanal / quinzenal)</span></label>
        <select id="dia_reuniao" name="dia_reuniao" defaultValue={1} className="input">
          {DIAS.map((d) => (
            <option key={d.valor} value={d.valor}>{d.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dia_mes_reuniao" className="label">Dia do mês <span className="text-chumbo font-normal">(apenas mensal, 1-31)</span></label>
        <input
          id="dia_mes_reuniao"
          name="dia_mes_reuniao"
          type="number"
          min={1}
          max={31}
          defaultValue={1}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="hora_reuniao" className="label">Horário da reunião</label>
        <input
          id="hora_reuniao"
          name="hora_reuniao"
          type="time"
          defaultValue="09:00"
          className="input"
        />
      </div>

      {error && (
        <p className="text-vinho text-sm text-center">{error}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Salvando…' : 'Continuar'}
      </button>
    </form>
  )
}
