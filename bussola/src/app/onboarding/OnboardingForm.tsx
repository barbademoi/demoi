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
        <label htmlFor="nome" className="label">Nome do estabelecimento</label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          placeholder="Ex.: Barbearia do João"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="endereco" className="label">Endereço <span className="text-text-muted font-normal">(opcional)</span></label>
        <input
          id="endereco"
          name="endereco"
          type="text"
          placeholder="Rua, número, bairro"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="dia_reuniao" className="label">Dia da reunião semanal</label>
        <select id="dia_reuniao" name="dia_reuniao" defaultValue={1} className="input">
          {DIAS.map((d) => (
            <option key={d.valor} value={d.valor}>{d.label}</option>
          ))}
        </select>
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
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Salvando…' : 'Continuar'}
      </button>
    </form>
  )
}
