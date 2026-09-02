'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { uploadFoto } from '@/lib/uploadFoto'
import {
  adicionarBarbeiroConfig, desativarBarbeiroConfig, reativarBarbeiroConfig,
  atualizarDiasBarbeiroConfig, inventarioExclusaoBarbeiro, excluirBarbeiroConfig,
} from './actions'
import { itensDoInventario, totalDoInventario, confirmacaoConfere, type Inventario } from '@/lib/equipe/exclusaoBarbeiro'
import type { Barbeiro } from '@/types/database'

type Exclusao = {
  id: string
  nome: string
  inventario: Inventario
  bloqueio: string | null
}

interface Props {
  barbeiros: Barbeiro[]
  isAutonomo?: boolean
}

export default function EquipeTab({ barbeiros: inicial, isAutonomo = false }: Props) {
  const [lista, setLista] = useState(inicial)
  const [novoNome, setNovoNome] = useState('')
  const [novoDias, setNovoDias] = useState('')
  const [novoTipo, setNovoTipo] = useState<'barbeiro' | 'recepcionista'>('barbeiro')
  const [novaFotoUrl, setNovaFotoUrl] = useState<string | null>(null)
  const [novaFotoPreview, setNovaFotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fotoRef = useRef<HTMLInputElement>(null)
  // Exclusão definitiva: prévia carregada, texto de confirmação e recados.
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const [carregandoExclusao, setCarregandoExclusao] = useState<string | null>(null)
  const [confirmacao, setConfirmacao] = useState('')
  const [erroExcluir, setErroExcluir] = useState<string | null>(null)
  const [avisoExclusao, setAvisoExclusao] = useState<string | null>(null)

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFoto(file, 'barbeiros')
      setNovaFotoUrl(url)
      setNovaFotoPreview(URL.createObjectURL(file))
    } catch { /* silently fail */ }
    finally { setUploading(false) }
  }

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData()
    formData.set('nome', novoNome)
    formData.set('tipo', novoTipo)
    formData.set('dias_trabalho_mes', novoDias)
    if (novaFotoUrl) formData.set('foto_url', novaFotoUrl)
    startTransition(async () => {
      const result = await adicionarBarbeiroConfig(formData)
      if (result?.error) { setErro(result.error); return }
      setNovoNome(''); setNovoDias(''); setNovaFotoUrl(null); setNovaFotoPreview(null); setMostrarForm(false)
    })
  }

  function handleSalvarDias(id: string, valor: string) {
    setLista(prev => prev.map(b => b.id === id
      ? { ...b, dias_trabalho_mes: valor.trim() === '' ? null : Math.min(31, Math.max(1, parseInt(valor, 10) || 0)) || null }
      : b))
    startTransition(async () => {
      await atualizarDiasBarbeiroConfig(id, valor)
    })
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    startTransition(async () => {
      await (ativo ? desativarBarbeiroConfig(id) : reativarBarbeiroConfig(id))
      setLista(prev => prev.map(b => b.id === id ? { ...b, ativo: !ativo } : b))
    })
  }

  // ── Excluir de vez ──
  // Duas etapas de propósito: primeiro o dono VÊ o que some junto, depois
  // confirma digitando o nome. Não há lixeira nem desfazer do outro lado.
  function abrirExclusao(id: string) {
    setErroExcluir(null)
    setConfirmacao('')
    setCarregandoExclusao(id)
    startTransition(async () => {
      const res = await inventarioExclusaoBarbeiro(id)
      setCarregandoExclusao(null)
      if ('error' in res) { setErroExcluir(res.error); return }
      setExclusao({ id, nome: res.nome, inventario: res.inventario, bloqueio: res.bloqueio })
    })
  }

  function confirmarExclusao() {
    if (!exclusao || exclusao.bloqueio) return
    setErroExcluir(null)
    const alvo = exclusao
    startTransition(async () => {
      const res = await excluirBarbeiroConfig(alvo.id, confirmacao)
      if ('error' in res && res.error) { setErroExcluir(res.error); return }
      setLista(prev => prev.filter(b => b.id !== alvo.id))
      setExclusao(null)
      setConfirmacao('')
      const total = totalDoInventario(alvo.inventario)
      setAvisoExclusao(
        `${alvo.nome} foi excluído` +
        (total > 0 ? ` junto com ${total} registro(s) do histórico dele.` : '.'),
      )
    })
  }

  const ativos = lista.filter(b => b.ativo)
  const inativos = lista.filter(b => !b.ativo)

  return (
    <div className="space-y-6">
      {/* Lista */}
      <div className="space-y-2">
        {ativos.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-border flex items-center justify-center">
              {b.foto_url ? (
                <Image src={b.foto_url} alt={b.nome} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-text-muted">{b.nome[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans text-text truncate">{b.nome}</p>
              <p className="text-xs font-sans text-text-muted capitalize">{b.tipo}</p>
            </div>
            {b.tipo !== 'recepcionista' && (
              <div className="flex flex-col items-end shrink-0">
                <label className="text-[10px] font-sans text-text-muted leading-none mb-1">Dias/mês</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  inputMode="numeric"
                  placeholder="padrão"
                  defaultValue={b.dias_trabalho_mes ?? ''}
                  onBlur={e => {
                    const atual = b.dias_trabalho_mes != null ? String(b.dias_trabalho_mes) : ''
                    if (e.target.value.trim() !== atual) handleSalvarDias(b.id, e.target.value)
                  }}
                  disabled={isPending}
                  title="Dias que vai trabalhar no mês. Em branco = usa o padrão da barbearia."
                  className="input w-20 h-8 text-xs text-center px-1 py-0"
                />
              </div>
            )}
            <div className="flex flex-col items-end gap-1 self-center">
              <button
                onClick={() => handleToggleAtivo(b.id, b.ativo)}
                disabled={isPending}
                className="text-xs text-text-muted hover:text-red-400 font-sans transition-colors"
              >
                Desativar
              </button>
              <button
                onClick={() => abrirExclusao(b.id)}
                disabled={isPending}
                className="text-[11px] text-text-muted/70 hover:text-red-400 font-sans transition-colors"
              >
                {carregandoExclusao === b.id ? 'Verificando…' : 'Excluir'}
              </button>
            </div>
          </div>
        ))}

        {inativos.length > 0 && (
          <>
            <p className="text-xs text-text-muted font-sans pt-2">Inativos</p>
            {inativos.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/50 border border-border/50 opacity-60">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-border flex items-center justify-center">
                  <span className="text-sm font-semibold text-text-muted">{b.nome[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-sans text-text">{b.nome}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleAtivo(b.id, b.ativo)}
                    disabled={isPending}
                    className="text-xs text-primary hover:text-primary/70 font-sans transition-colors"
                  >
                    Reativar
                  </button>
                  <button
                    onClick={() => abrirExclusao(b.id)}
                    disabled={isPending}
                    className="text-[11px] text-text-muted/70 hover:text-red-400 font-sans transition-colors"
                  >
                    {carregandoExclusao === b.id ? 'Verificando…' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {avisoExclusao && (
        <p className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs font-sans leading-relaxed text-text-muted">
          {avisoExclusao}
        </p>
      )}
      {erroExcluir && !exclusao && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 text-xs font-sans leading-relaxed text-red-200">
          {erroExcluir}
        </p>
      )}

      {/* Confirmação da exclusão — nada foi apagado ainda */}
      {exclusao && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/[0.05] p-4 space-y-3">
          <p className="text-sm font-semibold font-sans text-text">
            Excluir {exclusao.nome} de vez?
          </p>

          {exclusao.bloqueio ? (
            <>
              <p className="text-xs font-sans leading-relaxed text-amber-200">{exclusao.bloqueio}</p>
              <div className="flex gap-2">
                <button onClick={() => setExclusao(null)} className="btn-ghost text-xs flex-1">Fechar</button>
                <button
                  onClick={() => { handleToggleAtivo(exclusao.id, true); setExclusao(null) }}
                  disabled={isPending}
                  className="btn-primary text-xs flex-1"
                >
                  Desativar em vez disso
                </button>
              </div>
            </>
          ) : (
            <>
              {totalDoInventario(exclusao.inventario) === 0 ? (
                <p className="text-xs font-sans leading-relaxed text-text-muted">
                  Este cadastro não tem nenhum histórico — nada além dele será apagado.
                </p>
              ) : (
                <>
                  <p className="text-xs font-sans leading-relaxed text-text-muted">
                    Isto apaga também, e <strong className="text-text">sem volta</strong>:
                  </p>
                  <ul className="space-y-1">
                    {itensDoInventario(exclusao.inventario).map(item => (
                      <li key={item.tabela} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-1.5 text-xs font-sans">
                        <span className="text-text-muted">{item.rotulo}</span>
                        <strong className="text-text">{item.quantidade}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-sans leading-relaxed text-text-muted">
                    Se ele apenas saiu da barbearia, <strong className="text-text">Desativar</strong> é melhor:
                    ele some das telas e o que faturou continua no histórico.
                  </p>
                </>
              )}

              <div>
                <label htmlFor="confirmar-exclusao" className="text-xs font-sans text-text-muted">
                  Digite <strong className="text-text">{exclusao.nome}</strong> para confirmar
                </label>
                <input
                  id="confirmar-exclusao"
                  autoFocus
                  value={confirmacao}
                  onChange={e => { setConfirmacao(e.target.value); setErroExcluir(null) }}
                  placeholder={exclusao.nome}
                  className="input mt-1.5 w-full text-sm"
                />
              </div>

              {erroExcluir && <p className="text-red-400 text-xs font-sans">{erroExcluir}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => { setExclusao(null); setConfirmacao(''); setErroExcluir(null) }}
                  className="btn-ghost text-xs flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  disabled={isPending || !confirmacaoConfere(confirmacao, exclusao.nome)}
                  className="flex-1 rounded-xl bg-red-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? 'Excluindo…' : 'Excluir definitivamente'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Form adicionar (oculto em modo autônomo — barbeiro único) */}
      {isAutonomo ? null : mostrarForm ? (
        <form onSubmit={handleAdicionar} className="p-4 rounded-xl border border-border bg-surface-2 space-y-4">
          <p className="text-sm font-semibold font-sans text-text">Novo membro</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fotoRef.current?.click()}
              className="w-12 h-12 rounded-xl border border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors flex-shrink-0">
              {novaFotoPreview ? (
                <Image src={novaFotoPreview} alt="" width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
            <input type="text" placeholder="Nome" value={novoNome} onChange={e => setNovoNome(e.target.value)}
              required maxLength={60} className="input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            {(['barbeiro', 'recepcionista'] as const).map(t => (
              <label key={t} className={['flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-sans transition-all',
                novoTipo === t ? 'border-primary bg-primary/5 text-text' : 'border-border text-text-muted hover:border-primary/40'].join(' ')}>
                <input type="radio" checked={novoTipo === t} onChange={() => setNovoTipo(t)} className="hidden" />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
          {novoTipo !== 'recepcionista' && (
            <div>
              <label className="label">Dias que vai trabalhar no mês</label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="1" max="31" inputMode="numeric" placeholder="padrão"
                  value={novoDias} onChange={e => setNovoDias(e.target.value)}
                  className="input w-24 text-sm"
                />
                <p className="text-text-muted text-xs font-sans leading-relaxed flex-1">
                  Em branco: usa o padrão da barbearia. Preencha só quem folga mais.
                </p>
              </div>
            </div>
          )}
          {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-ghost text-sm flex-1">Cancelar</button>
            <button type="submit" disabled={isPending || uploading} className="btn-primary text-sm flex-1">
              {isPending ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setMostrarForm(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-muted hover:border-primary/50 hover:text-text text-sm font-sans transition-all">
          + Adicionar membro
        </button>
      )}
    </div>
  )
}
