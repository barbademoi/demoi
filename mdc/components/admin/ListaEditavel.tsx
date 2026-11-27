'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import UploadImagem from './UploadImagem'

export type CampoItem = { nome: string; rotulo: string; tipo?: 'texto' | 'area' | 'numero' | 'imagem' | 'check' }
type Item = Record<string, unknown> & { id: string }

/** CRUD simples de uma tabela (resultados, perguntas frequentes...). */
export default function ListaEditavel({
  titulo,
  itens,
  campos,
  resumo,
  salvar,
  excluir,
  novoPadrao,
}: {
  titulo: string
  itens: Item[]
  campos: CampoItem[]
  resumo: string
  salvar: (id: string | null, dados: Record<string, unknown>) => Promise<void>
  excluir: (id: string) => Promise<void>
  novoPadrao: Record<string, unknown>
}) {
  const [editando, setEditando] = useState<string | null>(null)
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{titulo}</h2>
        <button className="btn-sm bg-latao text-fundo" onClick={() => setEditando('novo')}>+ Adicionar</button>
      </div>
      {editando === 'novo' && (
        <FormItem campos={campos} item={{ id: '', ...novoPadrao }} onFechar={() => setEditando(null)} salvar={salvar} />
      )}
      {itens.length === 0 && editando !== 'novo' && <p className="text-suave">Nenhum item ainda.</p>}
      <ul className="divide-y divide-linha">
        {itens.map((it) => (
          <li key={it.id} className="py-3">
            {editando === it.id ? (
              <FormItem campos={campos} item={it} onFechar={() => setEditando(null)} salvar={salvar} excluir={excluir} />
            ) : (
              <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setEditando(it.id)}>
                <span className={it.ativo === false ? 'text-suave line-through' : ''}>
                  <span className="mr-2 text-xs text-suave">#{String(it.ordem ?? '')}</span>
                  {String(it[resumo] ?? '')}
                </span>
                <span className="text-sm text-latao">Editar</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FormItem({
  campos,
  item,
  onFechar,
  salvar,
  excluir,
}: {
  campos: CampoItem[]
  item: Item
  onFechar: () => void
  salvar: (id: string | null, dados: Record<string, unknown>) => Promise<void>
  excluir?: (id: string) => Promise<void>
}) {
  const router = useRouter()
  const [dados, setDados] = useState<Record<string, unknown>>(item)
  const [erro, setErro] = useState('')
  const [pendente, iniciar] = useTransition()
  const set = (k: string, v: unknown) => setDados((d) => ({ ...d, [k]: v }))

  return (
    <div className="my-3 space-y-3 rounded-xl border border-linha p-4">
      {campos.map((c) => (
        <div key={c.nome}>
          {c.tipo === 'check' ? (
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={dados[c.nome] !== false} onChange={(e) => set(c.nome, e.target.checked)} className="h-5 w-5 accent-[#D9A441]" />
              {c.rotulo}
            </label>
          ) : (
            <>
              <span className="rotulo text-sm">{c.rotulo}</span>
              {c.tipo === 'imagem' ? (
                <UploadImagem valor={String(dados[c.nome] ?? '')} onChange={(u) => set(c.nome, u)} pasta="itens" />
              ) : c.tipo === 'area' ? (
                <textarea className="campo py-2.5" rows={4} value={String(dados[c.nome] ?? '')} onChange={(e) => set(c.nome, e.target.value)} />
              ) : (
                <input
                  className="campo py-2.5"
                  inputMode={c.tipo === 'numero' ? 'numeric' : undefined}
                  value={String(dados[c.nome] ?? '')}
                  onChange={(e) => set(c.nome, e.target.value)}
                />
              )}
            </>
          )}
        </div>
      ))}
      {erro && <p className="erro">{erro}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-sm bg-latao text-fundo"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              try {
                await salvar(item.id || null, dados)
                onFechar()
                router.refresh()
              } catch (e) {
                setErro((e as Error).message)
              }
            })
          }
        >
          {pendente ? 'Salvando...' : 'Salvar'}
        </button>
        <button className="btn-sm border border-linha" onClick={onFechar}>Cancelar</button>
        {excluir && item.id && (
          <button
            className="btn-sm ml-auto text-perigo"
            onClick={() =>
              confirm('Excluir de vez?') &&
              iniciar(async () => {
                await excluir(item.id)
                onFechar()
                router.refresh()
              })
            }
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}
