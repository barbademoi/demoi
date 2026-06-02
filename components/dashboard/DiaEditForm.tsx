'use client'

import { useState, useTransition } from 'react'
import { dataLocalStr } from '@/lib/utils'

export type ServicoCampanha = { id: string; nome: string; pontos: number }

interface Props {
  mode: 'novo' | 'editar'
  dataInicial: string                     // 'YYYY-MM-DD' — quando mode='editar', fica fixa.
  valoresIniciais: Record<string, string> // servico_id → quantidade (string)
  servicosCampanha: ServicoCampanha[]
  // Parent persiste e devolve { error } ou { ok: true }. Mantém o `data`
  // como string literal — o action subjacente (`lancarDiaComoDono`) preserva
  // o dia sem regravar com timestamp atual.
  onSalvar: (data: string, servicos: { servico_id: string; quantidade: number }[]) => Promise<{ error?: string; ok?: true }>
  onCancelar: () => void
}

/**
 * Form de edição/criação de um dia de lançamentos. Compartilhado entre o modal
 * "Ver lançamentos" do dashboard e a tela `/dashboard/historico-lancamentos`.
 *
 * Em modo 'editar', a data é fixa (NÃO permite mover lançamento entre dias).
 * Pra mudar de dia, o dono apaga o existente e cria um novo.
 */
export default function DiaEditForm({
  mode,
  dataInicial,
  valoresIniciais,
  servicosCampanha,
  onSalvar,
  onCancelar,
}: Props) {
  const [formData, setFormData] = useState(dataInicial)
  const [formValores, setFormValores] = useState<Record<string, string>>(valoresIniciais)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hojeMax = dataLocalStr()

  const totalPreview = servicosCampanha.reduce((s, sv) => {
    const qtd = parseInt(formValores[sv.id] || '0', 10) || 0
    return s + qtd * sv.pontos
  }, 0)

  function handleSalvar() {
    setErro(null)
    setSucesso(false)
    // Inclui TODOS os serviços da campanha — quantidade 0 dispara DELETE
    // (necessário pra remover serviços que estavam no dia mas foram zerados).
    const servicos = servicosCampanha.map(s => ({
      servico_id: s.id,
      quantidade: parseInt(formValores[s.id] || '0', 10) || 0,
    }))
    startTransition(async () => {
      const res = await onSalvar(formData, servicos)
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      // Pequeno delay pra o "✓ Salvo!" ficar visível antes do parent fechar.
      setTimeout(() => { setSucesso(false); onCancelar() }, 800)
    })
  }

  return (
    <div className="space-y-4">
      {/* Data */}
      <div>
        <label className="label">Data</label>
        <input
          type="date"
          value={formData}
          onChange={e => setFormData(e.target.value)}
          max={hojeMax}
          className="input w-full"
          disabled={mode !== 'novo'}
        />
        {mode !== 'novo' && (
          <p className="text-text-muted text-[11px] font-sans mt-1">
            Pra mudar de dia, apague esse e crie um novo.
          </p>
        )}
      </div>

      {/* Serviços da campanha */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label !mb-0">Serviços</label>
          <p className="text-text-muted text-xs font-sans">
            Total: <span className="text-primary font-semibold tabular-nums">{totalPreview} pts</span>
          </p>
        </div>
        {servicosCampanha.length === 0 ? (
          <p className="text-text-muted text-sm font-sans italic">
            Sem serviços configurados na campanha deste mês.
          </p>
        ) : (
          <div className="space-y-2">
            {servicosCampanha.map(s => {
              const qtd = parseInt(formValores[s.id] || '0', 10) || 0
              const subtotal = qtd * s.pontos
              return (
                <div key={s.id} className="bg-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-text truncate">{s.nome}</p>
                    <p className="text-text-muted text-[11px] font-sans">{s.pontos} pts/un</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formValores[s.id] ?? ''}
                    onChange={e => setFormValores(v => ({ ...v, [s.id]: e.target.value }))}
                    className="input w-16 py-1.5 text-sm text-center"
                  />
                  <span className="text-text-muted text-xs font-sans tabular-nums w-14 text-right shrink-0">
                    {subtotal} pts
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

      {/* Footer */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancelar} className="btn-ghost flex-1 text-sm py-2.5" disabled={isPending}>
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={isPending || servicosCampanha.length === 0}
          className="btn-primary flex-1 text-sm py-2.5"
        >
          {sucesso ? '✓ Salvo!' : isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      <p className="text-text-muted text-[11px] font-sans italic text-center">
        Lançamento ficará marcado como &ldquo;✏️ dono&rdquo;
      </p>
    </div>
  )
}
