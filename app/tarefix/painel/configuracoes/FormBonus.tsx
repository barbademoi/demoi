'use client'

import { useState } from 'react'
import type { NivelBonus } from '@/lib/tarefix/tipos'
import { Erro, Interruptor, Rotulo, useAcao, useAviso } from '@/components/tarefix/ui'
import { salvarBonus } from './acoes'
import { DICAS } from '@/components/tarefix/dicas'

type Props = { ativo: boolean; mostrar: boolean; niveis: NivelBonus[] }
type Linha = { percentual: string; premio: string }

export function FormBonus({ ativo: a0, mostrar: m0, niveis: n0 }: Props) {
  const [ativo, setAtivo] = useState(a0)
  const [mostrar, setMostrar] = useState(m0)
  const [linhas, setLinhas] = useState<Linha[]>(
    n0.length ? n0.map((n) => ({ percentual: String(n.percentual), premio: n.premio })) : [{ percentual: '90', premio: 'R$ 50' }]
  )
  const { pendente, erro, rodar } = useAcao()
  const aviso = useAviso()

  function mudar(i: number, campo: keyof Linha, valor: string) {
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: campo === 'percentual' ? valor.replace(/\D/g, '').slice(0, 3) : valor } : l)))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        rodar(
          () => salvarBonus({ ativo, mostrar_para_colaborador: mostrar, niveis: linhas.map((l) => ({ percentual: Number(l.percentual), premio: l.premio })) }),
          () => aviso.mostrar('Bônus salvo')
        )
      }}
    >
      <Interruptor rotulo="Bônus ativo" descricao="Premia quem atingir o percentual no mês." {...DICAS.bonus} ligado={ativo} aoMudar={setAtivo} />
      {ativo && (
        <>
          <Interruptor rotulo="Mostrar para o colaborador" descricao="Ele vê os níveis e quanto falta para o próximo." {...DICAS.bonusMostrar} ligado={mostrar} aoMudar={setMostrar} />
          <div className="space-y-2">
            <Rotulo {...DICAS.bonusNiveis}>Níveis</Rotulo>
            {linhas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative w-24 shrink-0">
                  <input
                    className="tf-campo !pl-3 !pr-9 text-right"
                    inputMode="numeric"
                    value={l.percentual}
                    onChange={(e) => mudar(i, 'percentual', e.target.value)}
                    aria-label={`Percentual do nível ${i + 1}`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-tf-suave">%</span>
                </div>
                <span className="text-tf-suave">→</span>
                <input className="tf-campo" value={l.premio} onChange={(e) => mudar(i, 'premio', e.target.value)} placeholder="Ex.: R$ 50" aria-label={`Prêmio do nível ${i + 1}`} />
                <button
                  type="button"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-tf-suave hover:bg-tf-marca-clara disabled:opacity-30"
                  onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                  disabled={linhas.length === 1}
                  aria-label={`Remover nível ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {linhas.length < 5 && (
              <button type="button" className="min-h-[44px] text-sm font-bold text-tf-marca-texto" onClick={() => setLinhas((ls) => [...ls, { percentual: '100', premio: '' }])}>
                + Adicionar nível
              </button>
            )}
          </div>
        </>
      )}
      <Erro texto={erro} />
      <button type="submit" className="tf-botao w-full" disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar bônus'}
      </button>
      {aviso.elemento}
    </form>
  )
}
