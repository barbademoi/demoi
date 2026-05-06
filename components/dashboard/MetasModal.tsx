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
  bronze_premio: string
  prata_premio: string
  ouro_premio: string
}

interface Props {
  barbeiros: Barbeiro[]
  metasAtuais?: MetaIndividual[]
  metaColetiva?: number
  faturamentoAcumulado?: number
  premioColetivo?: string
  mes: number
  ano: number
}

export default function MetasModal({ barbeiros, metasAtuais, metaColetiva, faturamentoAcumulado, premioColetivo, mes, ano }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [msgSucesso, setMsgSucesso] = useState('✓ Metas salvas')

  const [metaColetivaVal, setMetaColetivaVal] = useState(String(metaColetiva ?? ''))
  const [faturamentoVal, setFaturamentoVal] = useState(String(faturamentoAcumulado ?? ''))
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
        bronze_premio: m?.bronze_premio ?? '',
        prata_premio: m?.prata_premio ?? '',
        ouro_premio: m?.ouro_premio ?? '',
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
      fd.set('faturamento_acumulado', faturamentoVal)
      fd.set('barbeiros', JSON.stringify(
        metas.map(m => ({
          id: m.id,
          bronze_comm: parseFloat(m.bronze_comm) || 0,
          prata_comm: parseFloat(m.prata_comm) || 0,
          ouro_comm: parseFloat(m.ouro_comm) || 0,
          bronze_premio: m.bronze_premio,
          prata_premio: m.prata_premio,
          ouro_premio: m.ouro_premio,
        }))
      ))
      const res = await salvarMetas(fd)
      if (res && 'error' in res) {
        setErro(res.error)
      } else {
        const salvos = res && 'salvos' in res ? (res as { salvos: number }).salvos : 0
        setSucesso(true)
        setMsgSucesso(`✓ Metas salvas (${salvos} barbeiro${salvos !== 1 ? 's' : ''})`)
        setOpen(false)
        setTimeout(() => setSucesso(false), 4000)
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm py-2 px-4 border border-border">
        {sucesso ? msgSucesso : 'Configurar metas'}
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        zIndex: 50, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as never,
      }}
    >
      <div style={{ minHeight: '100%', padding: '32px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className="card p-6 w-full max-w-2xl" style={{ maxWidth: '672px' }}>
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
                <label className="label">Faturamento acumulado (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={faturamentoVal}
                  onChange={e => setFaturamentoVal(e.target.value)}
                  placeholder="0,00" className="input"
                />
              </div>
              <div>
                <label className="label">Meta do mês (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={metaColetivaVal}
                  onChange={e => setMetaColetivaVal(e.target.value)}
                  placeholder="60000" className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Prêmio coletivo</label>
              <input
                type="text"
                value={premioVal}
                onChange={e => setPremioVal(e.target.value)}
                placeholder="Ex: Rodízio de pizza" className="input"
              />
            </div>
          </div>

          {/* Metas individuais */}
          <div>
            <h4 className="font-sans font-semibold text-text text-sm mb-3">Metas individuais</h4>
            <div className="space-y-3">
              {metas.map(m => (
                <div key={m.id} className="card p-3 space-y-2">
                  <p className="font-sans font-semibold text-text text-sm">{m.nome}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label metal-text-bronze">Bronze (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.bronze_comm}
                        onChange={e => updateMeta(m.id, 'bronze_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label metal-text-silver">Prata (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.prata_comm}
                        onChange={e => updateMeta(m.id, 'prata_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label metal-text-gold">Ouro (R$)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={m.ouro_comm}
                        onChange={e => updateMeta(m.id, 'ouro_comm', e.target.value)}
                        placeholder="0" className="input text-center py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Prêmio Bronze</label>
                      <input
                        type="text"
                        value={m.bronze_premio}
                        onChange={e => updateMeta(m.id, 'bronze_premio', e.target.value)}
                        placeholder="Ex: R$200" className="input py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label">Prêmio Prata</label>
                      <input
                        type="text"
                        value={m.prata_premio}
                        onChange={e => updateMeta(m.id, 'prata_premio', e.target.value)}
                        placeholder="Ex: R$350" className="input py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label">Prêmio Ouro</label>
                      <input
                        type="text"
                        value={m.ouro_premio}
                        onChange={e => updateMeta(m.id, 'ouro_premio', e.target.value)}
                        placeholder="Ex: R$500" className="input py-2 text-sm"
                      />
                    </div>
                  </div>
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
    </div>
  )
}
