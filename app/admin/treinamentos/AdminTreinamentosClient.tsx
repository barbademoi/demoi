'use client'

import { useState, useTransition } from 'react'
import { salvarTreinamento, excluirTreinamento } from './actions'

type Treinamento = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  youtube_id: string
  duracao: string | null
}

type Stats = {
  pendentes: number
  aprovadas_hoje: number
}

interface Props {
  treinamentos: Treinamento[]
  stats: Stats
}

const VAZIO: Omit<Treinamento, 'id'> = { ordem: 0, titulo: '', descricao: '', youtube_id: '', duracao: '' }

export default function AdminTreinamentosClient({ treinamentos, stats }: Props) {
  const [editando, setEditando] = useState<Treinamento | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [novo, setNovo] = useState({ ...VAZIO })
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSalvar(formData: FormData) {
    setErro(null)
    startTransition(async () => {
      const result = await salvarTreinamento(formData)
      if (result?.error) { setErro(result.error); return }
      setEditando(null)
      setAdicionando(false)
      setNovo({ ...VAZIO })
    })
  }

  function handleExcluir(id: string) {
    if (!confirm('Excluir este treinamento?')) return
    startTransition(async () => {
      const result = await excluirTreinamento(id)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-text">Treinamentos</h1>
            <p className="text-text-muted text-sm font-sans mt-0.5">Admin — gerenciar vídeos</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/contas"
              className="text-xs text-text-muted hover:text-text font-sans transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
            >
              Contas →
            </a>
            <button
              onClick={() => { setAdicionando(true); setEditando(null) }}
              className="btn-primary text-sm"
              disabled={isPending}
            >
              + Adicionar
            </button>
          </div>
        </div>

        {(stats.pendentes > 0 || stats.aprovadas_hoje > 0) && (
          <div className="flex gap-4 mb-6 text-sm font-sans">
            {stats.pendentes > 0 && (
              <span className="flex items-center gap-1.5 text-yellow-400">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                {stats.pendentes} compra{stats.pendentes !== 1 ? 's' : ''} pendente{stats.pendentes !== 1 ? 's' : ''}
              </span>
            )}
            {stats.aprovadas_hoje > 0 && (
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                {stats.aprovadas_hoje} aprovada{stats.aprovadas_hoje !== 1 ? 's' : ''} hoje
              </span>
            )}
          </div>
        )}

        {erro && (
          <p className="mb-4 text-red-400 text-sm font-sans text-center">{erro}</p>
        )}

        {/* Formulário de novo */}
        {adicionando && (
          <div className="card p-6 mb-6 border-primary/30">
            <h2 className="font-serif text-lg text-text mb-4">Novo treinamento</h2>
            <TreinamentoForm
              dados={novo}
              onChange={(k, v) => setNovo(prev => ({ ...prev, [k]: v }))}
              onSubmit={handleSalvar}
              onCancel={() => { setAdicionando(false); setNovo({ ...VAZIO }) }}
              isPending={isPending}
            />
          </div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {treinamentos.length === 0 && !adicionando && (
            <div className="card p-8 text-center">
              <p className="text-text-muted text-sm font-sans">Nenhum treinamento cadastrado.</p>
            </div>
          )}

          {treinamentos.map((t) => (
            <div key={t.id} className="card p-5">
              {editando?.id === t.id ? (
                <>
                  <h2 className="font-serif text-base text-text mb-4">Editar</h2>
                  <TreinamentoForm
                    id={t.id}
                    dados={editando}
                    onChange={(k, v) => setEditando(prev => prev ? { ...prev, [k]: v } : prev)}
                    onSubmit={handleSalvar}
                    onCancel={() => setEditando(null)}
                    isPending={isPending}
                  />
                </>
              ) : (
                <div className="flex items-start gap-4">
                  <span className="text-xs text-text-muted font-sans font-bold tabular-nums pt-0.5 w-5 shrink-0">
                    {String(t.ordem).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-text text-sm">{t.titulo}</p>
                    <p className="text-xs text-text-muted font-sans font-mono mt-0.5">
                      {t.youtube_id}
                      {t.duracao ? ` · ${t.duracao}` : ''}
                    </p>
                    {t.descricao && (
                      <p className="text-xs text-text-muted font-sans mt-1 leading-relaxed line-clamp-2">
                        {t.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditando({ ...t }); setAdicionando(false) }}
                      className="text-xs text-text-muted hover:text-text font-sans transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
                      disabled={isPending}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(t.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-sans transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
                      disabled={isPending}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

type FormDados = Omit<Treinamento, 'id'>

function TreinamentoForm({
  id,
  dados,
  onChange,
  onSubmit,
  onCancel,
  isPending,
}: {
  id?: string
  dados: FormDados
  onChange: (key: keyof FormDados, value: string | number) => void
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(new FormData(e.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Ordem *</label>
          <input
            name="ordem"
            type="number"
            min={1}
            required
            value={dados.ordem || ''}
            onChange={e => onChange('ordem', Number(e.target.value))}
            className="input"
            placeholder="1"
          />
        </div>
        <div>
          <label className="label">Duração</label>
          <input
            name="duracao"
            type="text"
            value={dados.duracao ?? ''}
            onChange={e => onChange('duracao', e.target.value)}
            className="input"
            placeholder="5 min"
          />
        </div>
      </div>

      <div>
        <label className="label">Título *</label>
        <input
          name="titulo"
          type="text"
          required
          value={dados.titulo}
          onChange={e => onChange('titulo', e.target.value)}
          className="input"
          placeholder="Ex: Configurações básicas"
        />
      </div>

      <div>
        <label className="label">YouTube ID *</label>
        <input
          name="youtube_id"
          type="text"
          required
          value={dados.youtube_id}
          onChange={e => onChange('youtube_id', e.target.value)}
          className="input font-mono"
          placeholder="Ex: dQw4w9WgXcQ"
        />
        <p className="text-xs text-text-muted font-sans mt-1">
          O código após &quot;watch?v=&quot; na URL do YouTube
        </p>
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea
          name="descricao"
          rows={2}
          value={dados.descricao ?? ''}
          onChange={e => onChange('descricao', e.target.value)}
          className="input resize-none"
          placeholder="Breve descrição do conteúdo"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isPending} className="btn-primary text-sm">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}
