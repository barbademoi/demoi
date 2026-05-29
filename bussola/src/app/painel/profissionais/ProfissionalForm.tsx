'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import Avatar from '@/components/Avatar'
import {
  FUNCOES_SUGERIDAS,
  MOTIVADORES,
  MAX_MOTIVADORES,
  ESTILOS_COMUNICACAO,
  type Profissional,
} from '@/lib/profissionais'
import { criarProfissional, atualizarProfissional } from './actions'
import RecortadorFoto from './RecortadorFoto'

const TIPOS_OK = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

interface Props {
  estabelecimentoId: string
  modo: 'novo' | 'editar'
  inicial?: Profissional
}

export default function ProfissionalForm({ estabelecimentoId, modo, inicial }: Props) {
  const hoje = new Date().toISOString().slice(0, 10)

  const [fotoUrl, setFotoUrl] = useState<string | null>(inicial?.foto_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [fileParaRecortar, setFileParaRecortar] = useState<File | null>(null)

  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [motivadores, setMotivadores] = useState<string[]>(inicial?.motivadores ?? [])
  const [estilo, setEstilo] = useState<string>(inicial?.estilo_comunicacao ?? '')
  const [secao2, setSecao2] = useState(modo === 'editar')

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleMotivador(m: string) {
    setMotivadores((prev) => {
      if (prev.includes(m)) return prev.filter((x) => x !== m)
      if (prev.length >= MAX_MOTIVADORES) return prev
      return [...prev, m]
    })
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-selecionar o mesmo arquivo
    if (!file) return
    setErroFoto(null)
    if (!TIPOS_OK.includes(file.type)) {
      setErroFoto('Use uma imagem JPG, PNG ou WEBP.')
      return
    }
    setFileParaRecortar(file)
  }

  async function enviarRecorte(blob: Blob) {
    setFileParaRecortar(null)
    setErroFoto(null)
    if (blob.size > MAX_BYTES) {
      setErroFoto('Imagem muito grande (máx. 2MB).')
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `${estabelecimentoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
      const { error: upErr } = await supabase.storage
        .from('profissionais-fotos')
        .upload(path, blob, { contentType: 'image/webp', upsert: false })
      if (upErr) {
        console.error('[upload foto]', upErr)
        setErroFoto('Falha no upload. Tente outra foto.')
        setUploading(false)
        return
      }
      const { data } = supabase.storage.from('profissionais-fotos').getPublicUrl(path)
      setFotoUrl(data.publicUrl)
    } catch (err) {
      console.error('[upload foto]', err)
      setErroFoto('Não foi possível enviar a imagem.')
    }
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('motivadores', JSON.stringify(motivadores))
    fd.set('foto_url', fotoUrl ?? '')
    fd.set('estilo_comunicacao', estilo)
    startTransition(async () => {
      const res =
        modo === 'novo'
          ? await criarProfissional(fd)
          : await atualizarProfissional(inicial!.id, fd)
      if (res?.error) setError(res.error)
    })
  }

  const cancelarHref = modo === 'editar' ? `/painel/profissionais/${inicial!.id}` : '/painel/profissionais'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {fileParaRecortar && (
        <RecortadorFoto
          file={fileParaRecortar}
          onConfirm={enviarRecorte}
          onCancel={() => setFileParaRecortar(null)}
        />
      )}

      {/* SEÇÃO 1 — DADOS BÁSICOS */}
      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-semibold text-text">Dados básicos</h2>

        <div className="flex items-center gap-4">
          <Avatar nome={nome || 'Novo'} fotoUrl={fotoUrl} size={64} />
          <div>
            <label className="btn-secondary px-4 py-2 text-sm cursor-pointer inline-block">
              {uploading ? 'Enviando…' : fotoUrl ? 'Trocar foto' : 'Adicionar foto'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFoto}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-text-muted mt-1.5">JPG, PNG ou WEBP. Opcional.</p>
            {erroFoto && <p className="text-vinho text-xs mt-1">{erroFoto}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="nome" className="label">Nome completo</label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: João da Silva"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="telefone" className="label">
            WhatsApp <span className="text-text-muted font-normal">(opcional, com DDD)</span>
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            defaultValue={inicial?.telefone ?? ''}
            placeholder="Ex.: 34 98424-3216"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="funcao" className="label">Função</label>
          <input
            id="funcao"
            name="funcao"
            type="text"
            list="funcoes-sugeridas"
            defaultValue={inicial?.funcao ?? ''}
            placeholder="Ex.: Atendente"
            className="input"
          />
          <datalist id="funcoes-sugeridas">
            {FUNCOES_SUGERIDAS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="data_entrada" className="label">Data de entrada</label>
          <input
            id="data_entrada"
            name="data_entrada"
            type="date"
            defaultValue={inicial?.data_entrada ?? hoje}
            className="input"
          />
        </div>
      </section>

      {/* SEÇÃO 2 — PERFIL PARA A IA (colapsável) */}
      <section className="card p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setSecao2((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h2 className="font-semibold text-text">Perfil para a IA</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Quanto mais você preencher, melhores ficam as sugestões da IA depois.
            </p>
          </div>
          <span className="text-text-muted text-xl leading-none">{secao2 ? '−' : '+'}</span>
        </button>

        {secao2 && (
          <div className="space-y-5 mt-5 pt-5 border-t border-border">
            <div>
              <label className="label">
                Motivadores <span className="text-text-muted font-normal">(até {MAX_MOTIVADORES}, em ordem)</span>
              </label>
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
                        sel
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-text hover:border-primary/40',
                      ].join(' ')}
                    >
                      {sel && <span className="font-semibold mr-1">{idx + 1}.</span>}
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="label">Estilo de comunicação preferido</label>
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
                      name="estilo_radio"
                      checked={estilo === op}
                      onChange={() => setEstilo(estilo === op ? '' : op)}
                      onClick={() => estilo === op && setEstilo('')}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text">{op}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="pontos_fortes" className="label">Pontos fortes</label>
              <textarea
                id="pontos_fortes"
                name="pontos_fortes"
                rows={2}
                defaultValue={inicial?.pontos_fortes ?? ''}
                placeholder="Ex.: muito bom com cliente difícil, sempre chega antes"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="pontos_desenvolvimento" className="label">Pontos de desenvolvimento</label>
              <textarea
                id="pontos_desenvolvimento"
                name="pontos_desenvolvimento"
                rows={2}
                defaultValue={inicial?.pontos_desenvolvimento ?? ''}
                placeholder="Ex.: tem dificuldade com prazos, precisa melhorar comunicação"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="notas_livres" className="label">Notas livres</label>
              <textarea
                id="notas_livres"
                name="notas_livres"
                rows={2}
                defaultValue={inicial?.notas_livres ?? ''}
                placeholder="Ex.: filho no hospital, quer abrir próprio negócio em 2 anos"
                className="input"
              />
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-vinho text-sm text-center">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending || uploading} className="btn-primary flex-1">
          {isPending ? 'Salvando…' : modo === 'novo' ? 'Salvar' : 'Salvar alterações'}
        </button>
        <Link href={cancelarHref} className="text-text-muted hover:text-text px-4 py-4 text-sm">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
