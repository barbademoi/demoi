'use client'

import { useState, useTransition } from 'react'
import { salvarMetas } from '@/app/dashboard/metas/actions'
import { nomeMes } from '@/lib/utils'
import type { Barbeiro, MetaIndividual } from '@/types/database'

interface MetaBarbeiro {
  id: string
  nome: string
  bronze_comm: string
  prata_comm: string
  ouro_comm: string
}

interface Props {
  barbeiros: Barbeiro[]
  metasAtuais?: MetaIndividual[]
  metaColetiva?: number
  premioColetivo?: string
  mes: number
  ano: number
}

export default function MetasModal({ barbeiros, metasAtuais, metaColetiva, premioColetivo, mes, ano }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [metaColetivaVal, setMetaColetivaVal] = useState(String(metaColetiva ?? ''))
  const [premioVal, setPremioVal] = useState(premioColetivo ?? '')
  const [metas, setMetas] = useState<MetaBarbeiro[]>(() =>
    barbeiros.map(b => {
      const m = metasAtuais?.find(mi => mi.barbeiro_id === b.id)
      return {
        id: b.id,
        nome: b.nome,
        bronze_comm: String(m?.bronze_comm ?? ''),
        prata_comm: String(m?.prata_comm ?? ''),
        ouro_comm: String(m?.ouro_comm ?? ''),
      }
    })
  )

  function updateMeta(id: string, field: keyof Omit<MetaBarbeiro, 'id' | 'nome'>, value: string) {
    setMetas(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('mes', String(mes))
      fd.set('ano', String(ano))
      fd.set('meta_coletiva', metaColetivaVal)
      fd.set('premio_coletivo', premioVal)
      fd.set('barbeiros', JSON.stringify(
        metas.map(m => ({
          id: m.id,
          bronze_comm: parseFloat(m.bronze_comm) || 0,
          prata_comm: parseFloat(m.prata_comm) || 0,
          ouro_comm: parseFloat(m.ouro_comm) || 0,
        }))
      ))
      const res = await salvarMetas(fd)
      if (res && 'error' in res) {
        setErro(res.error)
      } else {
        setSucesso(true)
        setOpen(false)
        setTimeout(() => setSucesso(false), 3000)
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm py-2 px-4 border border-border">
        {sucesso ? '✓ Metas salvas' : 'Configurar metas'}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card p-6 w-full max-w-2xl my-4 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl text-text">
            Metas — <span className="capitalize">{nomeMes(mes)} {ano}</span>
          </h3>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meta coletiva */}
          <div className="card p-4 space-y-3">
            <h4 className="font-sans font-semibold text-text text-sm">Meta coletiva</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Valor (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={metaColetivaVal}
                  onChange={e => setMetaColetivaVal(e.target.value)}
                  placeholder="60000" className="input"
                />
              </div>
              <div>
                <label className="label">Prêmio</label>
                <input
                  type="text"
                  value={premioVal}
                  onChange={e => setPremioVal(e.target.value)}
                  placeholder="Rodízio de pizza" className="input"
                />
              </div>
            </div>
          </div>

          {/* Metas individuais */}
          <div>
            <h4 className="font-sans font-semibold text-text text-sm mb-3">Metas individuais</h4>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 px-1">
                <span className="label col-span-1">Barbeiro</span>
                <span className="label text-center metal-text-bronze">Bronze</span>
                <span className="label text-center metal-text-silver">Prata</span>
                <span className="label text-center metal-text-gold">Ouro</span>
              </div>
              {metas.map(m => (
                <div key={m.id} className="grid grid-cols-4 gap-2 items-center">
                  <span className="font-sans text-sm text-text truncate">{m.nome}</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={m.bronze_comm}
                    onChange={e => updateMeta(m.id, 'bronze_comm', e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                  <input
                    type="number" step="0.01" min="0"
                    value={m.prata_comm}
                    onChange={e => updateMeta(m.id, 'prata_comm', e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                  <input
                    type="number" step="0.01" min="0"
                    value={m.ouro_comm}
                    onChange={e => updateMeta(m.id, 'ouro_comm', e.target.value)}
                    placeholder="0" className="input text-center py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Salvando…' : 'Salvar metas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
