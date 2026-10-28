'use client'

import { useMemo, useState } from 'react'
import { calendarioDoPeriodo } from '@/lib/operacao/calendario'

/**
 * CALENDÁRIO DO MÊS — onde o dono diz em que dias a barbearia não abre.
 *
 * O sistema já sabe duas coisas sozinho: o dia da semana (do cadastro acima)
 * e o feriado nacional (calculado, sem rede). Esta tela é a terceira fonte: a
 * exceção daquele mês — a viagem, a reforma, o feriado municipal, ou o
 * feriado nacional em que esta barbearia decide trabalhar.
 *
 * Por isso cada dia mostra POR QUE está fechado. "Fechado" sem motivo faria o
 * dono clicar às cegas pra descobrir o que o sistema assumiu por ele.
 */

const NOMES_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

interface Props {
  diasTrabalhados: { dia: string; ativo: boolean }[] | null
  fechados: string[]
  abertos: string[]
  onChange: (fechados: string[], abertos: string[]) => void
}

export default function CalendarioOperacao({ diasTrabalhados, fechados, abertos, onChange }: Props) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())

  const primeiro = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const ultimo = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const dias = useMemo(
    () => calendarioDoPeriodo(primeiro, ultimo, {
      diasTrabalhados,
      fechadosManuais: fechados,
      abertosManuais: abertos,
    }),
    [primeiro, ultimo, diasTrabalhados, fechados, abertos],
  )

  // Quantos quadrados vazios antes do dia 1, pra alinhar na coluna certa.
  const vazios = new Date(`${primeiro}T12:00:00`).getDay()

  const navegar = (delta: number) => {
    const d = new Date(ano, mes + delta, 1)
    setMes(d.getMonth())
    setAno(d.getFullYear())
  }

  /**
   * Um clique alterna entre os três estados possíveis daquela data, e a lista
   * em que ela entra depende do que o calendário diria SEM ela. Guardar um
   * "fechado" num dia que já fecharia por domingo seria lixo que sobrevive à
   * mudança do cadastro semanal.
   */
  const alternar = (iso: string) => {
    const dia = dias.find((d) => d.data === iso)
    if (!dia) return
    // Tira a data das duas listas e decide em qual ela reentra. O estado final
    // depende do que o calendário diria SEM ela: guardar "fechado" num dia que
    // já fecha por domingo seria lixo que sobrevive à mudança do cadastro.
    const semFechado = fechados.filter((d) => d !== iso)
    const semAberto = abertos.filter((d) => d !== iso)

    if (dia.aberto) {
      // Estava aberto por exceção minha → basta remover a exceção.
      // Estava aberto pela regra → precisa entrar em "fechados".
      if (dia.motivo === null && abertos.includes(iso)) onChange(semFechado, semAberto)
      else onChange([...semFechado, iso], semAberto)
      return
    }
    // Estava fechado por mim → remover basta. Fechado pela regra (semana ou
    // feriado) → precisa de exceção explícita pra abrir.
    if (dia.motivo === 'manual') onChange(semFechado, semAberto)
    else onChange(semFechado, [...semAberto, iso])
  }

  const totalAbertos = dias.filter((d) => d.aberto).length

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label mb-0">Dias que não vai abrir</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navegar(-1)} aria-label="Mês anterior"
            className="h-7 w-7 rounded-lg border border-border text-text-muted transition-colors hover:border-primary/40 hover:text-text">‹</button>
          <span className="min-w-[8.5rem] text-center font-sans text-sm text-text">{MESES[mes]} {ano}</span>
          <button type="button" onClick={() => navegar(1)} aria-label="Próximo mês"
            className="h-7 w-7 rounded-lg border border-border text-text-muted transition-colors hover:border-primary/40 hover:text-text">›</button>
        </div>
      </div>

      <p className="mb-3 font-sans text-xs leading-snug text-text-muted">
        Domingo e feriado nacional já vêm marcados sozinhos. Clique num dia pra fechar ou reabrir —
        serve pra viagem, reforma, feriado da cidade, ou pra trabalhar num feriado.
      </p>

      <div className="grid grid-cols-7 gap-1">
        {NOMES_SEMANA.map((n, i) => (
          <div key={i} className="pb-1 text-center font-sans text-[10px] uppercase tracking-wide text-text-muted">{n}</div>
        ))}
        {Array.from({ length: vazios }, (_, i) => <div key={`v${i}`} />)}
        {dias.map((d) => {
          const num = Number(d.data.slice(8, 10))
          const titulo = d.aberto
            ? (d.feriado ? `${d.feriado.nome} — aberto` : 'Aberto')
            : d.motivo === 'feriado' ? d.feriado!.nome
              : d.motivo === 'semana' ? 'Fecha neste dia da semana'
                : 'Fechado por você'
          return (
            <button
              key={d.data}
              type="button"
              title={titulo}
              aria-label={`${num} — ${titulo}`}
              onClick={() => alternar(d.data)}
              className={[
                'relative h-10 rounded-lg border font-sans text-xs transition-all',
                d.aberto
                  ? 'border-border bg-surface-2 text-text hover:border-primary/40'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-500/60',
              ].join(' ')}
            >
              {num}
              {/* O ponto marca feriado, aberto ou fechado: é a informação que
                  o dono não tem de cabeça e que explica a marcação. */}
              {d.feriado && (
                <span aria-hidden="true"
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${d.aberto ? 'bg-text-muted' : 'bg-amber-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 font-sans text-xs text-text-muted">
        {totalAbertos} {totalAbertos === 1 ? 'dia aberto' : 'dias abertos'} em {MESES[mes]} · o ponto marca feriado
      </p>
    </div>
  )
}
