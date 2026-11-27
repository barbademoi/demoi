'use client'

import type { Opcao } from '@/lib/opcoes'

/**
 * Opções como botões grandes (radio ou checkbox) — mais fácil de tocar no
 * celular do que um <select>.
 */
export default function Escolha({
  nome,
  opcoes,
  valor,
  onChange,
  multiplo = false,
  max,
  colunas = 1,
}: {
  nome: string
  opcoes: Opcao[]
  valor: string | string[]
  onChange: (v: string | string[]) => void
  multiplo?: boolean
  max?: number
  colunas?: 1 | 2
}) {
  const lista = Array.isArray(valor) ? valor : valor ? [valor] : []

  function alternar(v: string) {
    if (!multiplo) return onChange(v === valor ? '' : v)
    if (lista.includes(v)) return onChange(lista.filter((x) => x !== v))
    if (max && lista.length >= max) return
    onChange([...lista, v])
  }

  return (
    <div className={`grid gap-2.5 ${colunas === 2 ? 'sm:grid-cols-2' : ''}`} role={multiplo ? 'group' : 'radiogroup'}>
      {opcoes.map((o) => {
        const ativo = lista.includes(o.valor)
        return (
          <button
            type="button"
            key={o.valor}
            role={multiplo ? 'checkbox' : 'radio'}
            aria-checked={ativo}
            onClick={() => alternar(o.valor)}
            className={`chip text-left ${ativo ? 'chip-ativo' : ''}`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${multiplo ? 'rounded-md' : 'rounded-full'} ${
                ativo ? 'border-latao bg-latao text-fundo' : 'border-suave/50'
              }`}
            >
              {ativo && <span className="text-[11px] font-black leading-none">✓</span>}
            </span>
            <span>{o.rotulo}</span>
          </button>
        )
      })}
      {/* valor real enviado no FormData */}
      {lista.map((v) => (
        <input key={v} type="hidden" name={nome} value={v} />
      ))}
    </div>
  )
}
