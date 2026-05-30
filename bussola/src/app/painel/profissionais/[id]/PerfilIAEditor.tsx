'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import {
  MOTIVADORES,
  MAX_MOTIVADORES,
  ESTILOS_COMUNICACAO,
  type Profissional,
} from '@/lib/profissionais'
import { salvarPerfilIA } from '../actions'
import { useBodyScrollLock } from '@/lib/hooks'

type CampoTexto = 'pontos_fortes' | 'pontos_desenvolvimento' | 'notas_livres'
type Campo = 'motivadores' | 'estilo_comunicacao' | CampoTexto

const LABELS: Record<Campo, string> = {
  motivadores: 'Motivadores',
  estilo_comunicacao: 'Estilo de comunicação',
  pontos_fortes: 'Pontos fortes',
  pontos_desenvolvimento: 'Pontos de desenvolvimento',
  notas_livres: 'Notas livres',
}

type Estado = Pick<
  Profissional,
  'motivadores' | 'estilo_comunicacao' | 'pontos_fortes' | 'pontos_desenvolvimento' | 'notas_livres'
>

export default function PerfilIAEditor({ id, inicial }: { id: string; inicial: Estado }) {
  const [dados, setDados] = useState<Estado>(inicial)
  const [editando, setEditando] = useState<Campo | null>(null)
  useBodyScrollLock(editando !== null)

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-text mb-4">Perfil para IA</h3>

      <div className="divide-y divide-border">
        <Linha label={LABELS.motivadores} onEdit={() => setEditando('motivadores')}>
          {dados.motivadores && dados.motivadores.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dados.motivadores.map((m, i) => (
                <span key={m} className="text-xs bg-primary-soft text-primary rounded-full px-2 py-0.5">
                  {i + 1}. {m}
                </span>
              ))}
            </div>
          ) : (
            <Vazio />
          )}
        </Linha>

        <Linha label={LABELS.estilo_comunicacao} onEdit={() => setEditando('estilo_comunicacao')}>
          {dados.estilo_comunicacao ? <Texto>{dados.estilo_comunicacao}</Texto> : <Vazio />}
        </Linha>

        {(['pontos_fortes', 'pontos_desenvolvimento', 'notas_livres'] as CampoTexto[]).map((campo) => (
          <Linha key={campo} label={LABELS[campo]} onEdit={() => setEditando(campo)}>
            {dados[campo] ? <Texto>{dados[campo]}</Texto> : <Vazio />}
          </Linha>
        ))}
      </div>

      {editando && (
        <ModalEdicao
          id={id}
          campo={editando}
          dados={dados}
          onClose={() => setEditando(null)}
          onSaved={(campo, valor) => {
            setDados((d) => ({ ...d, [campo]: valor }))
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

function Linha({
  label,
  children,
  onEdit,
}: {
  label: string
  children: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="py-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {children}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-chumbo hover:text-marrom shrink-0"
        aria-label={`Editar ${label}`}
      >
        <Pencil size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

function Texto({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text whitespace-pre-wrap">{children}</p>
}

function Vazio() {
  return <p className="text-sm text-text-muted/70 italic">Não preenchido</p>
}

function ModalEdicao({
  id,
  campo,
  dados,
  onClose,
  onSaved,
}: {
  id: string
  campo: Campo
  dados: Estado
  onClose: () => void
  onSaved: (campo: Campo, valor: string[] | string | null) => void
}) {
  const [motivadores, setMotivadores] = useState<string[]>(dados.motivadores ?? [])
  const [estilo, setEstilo] = useState<string>(dados.estilo_comunicacao ?? '')
  const [texto, setTexto] = useState<string>(
    campo === 'pontos_fortes' || campo === 'pontos_desenvolvimento' || campo === 'notas_livres'
      ? dados[campo] ?? ''
      : ''
  )
  const [isPending, startTransition] = useTransition()

  function toggleMotivador(m: string) {
    setMotivadores((prev) => {
      if (prev.includes(m)) return prev.filter((x) => x !== m)
      if (prev.length >= MAX_MOTIVADORES) return prev
      return [...prev, m]
    })
  }

  function salvar() {
    let valor: string[] | string | null
    if (campo === 'motivadores') valor = motivadores
    else if (campo === 'estilo_comunicacao') valor = estilo || null
    else valor = texto.trim() || null

    startTransition(async () => {
      const res = await salvarPerfilIA(id, campo, valor)
      if (!res?.error) onSaved(campo, valor)
    })
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-[100dvh] z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-lg w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-semibold text-text mb-4">{LABELS[campo]}</h4>

        {campo === 'motivadores' && (
          <div className="flex flex-wrap gap-2">
            {MOTIVADORES.map((m) => {
              const idx = motivadores.indexOf(m)
              const sel = idx >= 0
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMotivador(m)}
                  className={[
                    'px-3 py-2 rounded-xl border text-sm transition-colors',
                    sel ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text hover:border-primary/40',
                  ].join(' ')}
                >
                  {sel && <span className="font-semibold mr-1">{idx + 1}.</span>}
                  {m}
                </button>
              )
            })}
          </div>
        )}

        {campo === 'estilo_comunicacao' && (
          <div className="space-y-2">
            {ESTILOS_COMUNICACAO.map((op) => (
              <label
                key={op}
                className={[
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  estilo === op ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40',
                ].join(' ')}
              >
                <input
                  type="radio"
                  checked={estilo === op}
                  onChange={() => setEstilo(op)}
                  onClick={() => estilo === op && setEstilo('')}
                  className="accent-primary"
                />
                <span className="text-sm text-text">{op}</span>
              </label>
            ))}
          </div>
        )}

        {(campo === 'pontos_fortes' || campo === 'pontos_desenvolvimento' || campo === 'notas_livres') && (
          <textarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="input"
            autoFocus
          />
        )}

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={salvar} disabled={isPending} className="btn-primary flex-1 py-3">
            {isPending ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text px-4">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
