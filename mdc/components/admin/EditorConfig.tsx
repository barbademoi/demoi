'use client'

import { useState, useTransition } from 'react'
import { salvarConfig } from '@/app/admin/configuracoes/actions'

export type CampoConfig = {
  nome: string
  rotulo: string
  tipo?: 'texto' | 'area' | 'lista' | 'url' | 'numero'
  ajuda?: string
  linhas?: number
}

/**
 * Edita uma linha de "settings".
 * - Com `campos`: o valor é um objeto { campo: valor } ("lista" = um item por linha).
 * - Sem `campos`: o valor é um texto simples.
 */
export default function EditorConfig({
  chave,
  titulo,
  descricao,
  campos,
  valor,
  tipoSimples = 'texto',
  ajudaSimples,
}: {
  chave: string
  titulo: string
  descricao?: string
  campos?: CampoConfig[]
  valor: unknown
  tipoSimples?: 'texto' | 'area' | 'url'
  ajudaSimples?: string
}) {
  const inicial: Record<string, string> = {}
  if (campos) {
    const obj = (valor ?? {}) as Record<string, unknown>
    for (const c of campos) {
      const v = obj[c.nome]
      inicial[c.nome] = Array.isArray(v) ? v.join('\n') : v === undefined || v === null ? '' : String(v)
    }
  } else {
    inicial.__ = typeof valor === 'string' ? valor : ''
  }

  const [dados, setDados] = useState(inicial)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  function salvar() {
    setMsg(null)
    let v: unknown
    if (campos) {
      const o: Record<string, unknown> = {}
      for (const c of campos) {
        const s = dados[c.nome] ?? ''
        if (c.tipo === 'lista') o[c.nome] = s.split('\n').map((x) => x.trim()).filter(Boolean)
        else if (c.tipo === 'numero') o[c.nome] = s.trim() === '' ? null : Number(s.replace(',', '.'))
        else o[c.nome] = s.trim()
      }
      v = o
    } else {
      v = (dados.__ ?? '').trim()
    }
    iniciar(async () => {
      const r = await salvarConfig(chave, v)
      setMsg(r.ok ? { ok: true, t: 'Salvo!' } : { ok: false, t: r.erro ?? 'Erro ao salvar' })
    })
  }

  const entrada = (nome: string, tipo: string | undefined, linhas?: number) => {
    const comum = {
      id: `${chave}-${nome}`,
      value: dados[nome] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDados({ ...dados, [nome]: e.target.value }),
      className: 'campo',
    }
    if (tipo === 'area' || tipo === 'lista') return <textarea {...comum} rows={linhas ?? (tipo === 'lista' ? 6 : 5)} />
    return <input {...comum} type={tipo === 'url' ? 'url' : 'text'} inputMode={tipo === 'numero' ? 'decimal' : undefined} />
  }

  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
      <div className="mt-5 space-y-5">
        {campos ? (
          campos.map((c) => (
            <div key={c.nome}>
              <label htmlFor={`${chave}-${c.nome}`} className="rotulo text-sm">{c.rotulo}</label>
              {entrada(c.nome, c.tipo, c.linhas)}
              {(c.ajuda || c.tipo === 'lista') && <p className="ajuda">{c.ajuda ?? 'Um item por linha.'}</p>}
            </div>
          ))
        ) : (
          <div>
            {entrada('__', tipoSimples)}
            {ajudaSimples && <p className="ajuda">{ajudaSimples}</p>}
          </div>
        )}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={salvar} disabled={pendente} className="btn-sm bg-latao px-5 text-fundo">
          {pendente ? 'Salvando...' : 'Salvar'}
        </button>
        {msg && <span className={msg.ok ? 'text-ok' : 'text-perigo'}>{msg.t}</span>}
      </div>
    </section>
  )
}
