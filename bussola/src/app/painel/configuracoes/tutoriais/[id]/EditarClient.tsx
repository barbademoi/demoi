'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import Modal from '@/components/Modal'
import type { PassoTutorial } from '@/lib/tutoriais'
import { salvarTutorial } from '../adminActions'

interface Props {
  id: string
  tituloInicial: string
  descricaoInicial: string
  categoriaNome: string
  passosIniciais: PassoTutorial[]
}

interface PassoEditavel {
  numero: number
  titulo: string
  conteudo: string
  dica: string
}

function paraEditavel(p: PassoTutorial): PassoEditavel {
  return {
    numero: p.numero,
    titulo: p.titulo ?? '',
    conteudo: p.conteudo,
    dica: p.dica ?? '',
  }
}

export default function EditarClient({
  id,
  tituloInicial,
  descricaoInicial,
  categoriaNome,
  passosIniciais,
}: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(tituloInicial)
  const [descricao, setDescricao] = useState(descricaoInicial)
  const [passos, setPassos] = useState<PassoEditavel[]>(passosIniciais.map(paraEditavel))
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState<null | 'regenerar'>(null)
  const [regenerando, setRegenerando] = useState(false)
  const [erroRegen, setErroRegen] = useState<string | null>(null)

  function atualizar(i: number, campo: keyof PassoEditavel, valor: string) {
    setPassos((arr) => arr.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)))
  }

  function adicionar() {
    setPassos((arr) => [
      ...arr,
      { numero: arr.length + 1, titulo: '', conteudo: '', dica: '' },
    ])
  }

  function remover(i: number) {
    setPassos((arr) => arr.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, numero: idx + 1 })))
  }

  function salvar() {
    setErro(null)
    startTransition(async () => {
      const r = await salvarTutorial({
        id,
        titulo,
        descricao_curta: descricao || null,
        passos: passos.map((p) => ({
          numero: p.numero,
          titulo: p.titulo || null,
          conteudo: p.conteudo,
          dica: p.dica || null,
        })),
      })
      if (r?.error) {
        setErro(r.error)
        return
      }
      router.push('/painel/configuracoes/tutoriais')
      router.refresh()
    })
  }

  async function regenerar() {
    setErroRegen(null)
    setRegenerando(true)
    try {
      const resp = await fetch(`/api/admin/tutoriais/${id}/regenerar`, { method: 'POST' })
      const j = await resp.json()
      if (!resp.ok) {
        setErroRegen(j?.error ?? 'Falha ao regenerar.')
        return
      }
      const novos: PassoTutorial[] = j.passos ?? []
      setPassos(novos.map(paraEditavel))
      setConfirmar(null)
    } catch {
      setErroRegen('Falha de conexão.')
    } finally {
      setRegenerando(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <Link href="/painel/configuracoes/tutoriais" className="inline-flex items-center gap-1 text-sm text-grafite">
        <ChevronLeft size={16} strokeWidth={1.5} /> Voltar
      </Link>

      <header>
        <span className="text-xs text-chumbo bg-linho rounded-full px-2.5 py-0.5">{categoriaNome}</span>
        <h1 className="text-xl font-semibold text-text mt-2">Editar tutorial</h1>
        <p className="text-xs text-vinho mt-1">
          ⚠ Estas edições afetam todos os usuários da Bússola.
        </p>
      </header>

      <div className="card p-5 space-y-3">
        <div>
          <label className="text-xs text-chumbo font-medium">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="input mt-1"
            placeholder="Título do tutorial"
          />
        </div>
        <div>
          <label className="text-xs text-chumbo font-medium">Descrição curta</label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="input mt-1"
            placeholder="Uma frase que resume o tutorial"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text">Passos ({passos.length})</h2>
        <button
          type="button"
          onClick={() => setConfirmar('regenerar')}
          className="btn-secondary text-sm"
          disabled={regenerando}
        >
          <Sparkles size={14} strokeWidth={1.5} />
          {regenerando ? 'Regenerando…' : 'Regenerar com IA'}
        </button>
      </div>

      {passos.map((p, i) => (
        <div key={i} className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-marrom">Passo {p.numero}</span>
            <button
              type="button"
              onClick={() => remover(i)}
              className="text-chumbo hover:text-vinho text-xs inline-flex items-center gap-1"
            >
              <Trash2 size={13} strokeWidth={1.5} /> Remover
            </button>
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Título</label>
            <input
              value={p.titulo}
              onChange={(e) => atualizar(i, 'titulo', e.target.value)}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Conteúdo</label>
            <textarea
              value={p.conteudo}
              onChange={(e) => atualizar(i, 'conteudo', e.target.value)}
              rows={4}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Dica (opcional)</label>
            <textarea
              value={p.dica}
              onChange={(e) => atualizar(i, 'dica', e.target.value)}
              rows={2}
              className="input mt-1"
            />
          </div>
        </div>
      ))}

      <button type="button" onClick={adicionar} className="btn-secondary w-full">
        <Plus size={16} strokeWidth={1.5} /> Adicionar passo
      </button>

      {erro && <p className="text-sm text-vinho">{erro}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={salvar} disabled={isPending} className="btn-primary flex-1 disabled:opacity-60">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <Link href="/painel/configuracoes/tutoriais" className="btn-secondary">
          Cancelar
        </Link>
      </div>

      <Modal open={confirmar === 'regenerar'} onClose={() => !regenerando && setConfirmar(null)}>
        <div className="p-5">
          <h3 className="font-semibold text-text">Regenerar passos com a IA?</h3>
          <p className="text-sm text-grafite mt-2">
            Isso vai substituir todos os passos atuais pelo que a IA gerar agora. A ação não pode ser desfeita.
          </p>
          {erroRegen && <p className="text-sm text-vinho mt-3">{erroRegen}</p>}
          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={regenerar}
              disabled={regenerando}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {regenerando ? 'Regenerando…' : 'Sim, regenerar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmar(null)}
              disabled={regenerando}
              className="text-grafite px-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
