'use client'

import { useState, useTransition } from 'react'
import { alternarFeedbackAtivo, salvarFeedbackConfig, salvarBrinde, excluirBrinde } from './actions'
import type { Brinde } from '@/types/database'

interface BarbeariaFC {
  id: string
  nome: string
  feedback_ativo: boolean
  feedback_slug: string | null
  feedback_mensagem_pos: string | null
  feedback_google_review_url: string | null
  feedback_nota_minima_positivo: number
  feedback_gamificacao_ativa: boolean
  feedback_pontos_por_feedback: number
  feedback_limite_diario_pontuavel: number
  feedback_brinde_minimo_id: string | null
}

interface Props {
  barbearia: BarbeariaFC
  brindes: Brinde[]
}

export default function FeedbackConfigClient({ barbearia, brindes }: Props) {
  const [ativo, setAtivo] = useState(barbearia.feedback_ativo)
  const [slug, setSlug] = useState(barbearia.feedback_slug ?? '')
  const [mensagemPos, setMensagemPos] = useState(barbearia.feedback_mensagem_pos ?? '')
  const [brindeMinimoId, setBrindeMinimoId] = useState(barbearia.feedback_brinde_minimo_id ?? '')
  const [googleUrl, setGoogleUrl] = useState(barbearia.feedback_google_review_url ?? '')
  const [notaMin, setNotaMin] = useState(barbearia.feedback_nota_minima_positivo)
  const [gamif, setGamif] = useState(barbearia.feedback_gamificacao_ativa)
  const [pontos, setPontos] = useState(barbearia.feedback_pontos_por_feedback)
  const [limite, setLimite] = useState(barbearia.feedback_limite_diario_pontuavel)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [isPending, startTransition] = useTransition()

  const urlPublica = slug
    ? (typeof window === 'undefined' ? `/c/${slug}` : `${window.location.origin}/c/${slug}`)
    : ''

  function handleToggleAtivo(novo: boolean) {
    setErro(null)
    startTransition(async () => {
      const res = await alternarFeedbackAtivo(novo)
      if (res?.error) { setErro(res.error); return }
      setAtivo(novo)
      if (novo && !slug) {
        // server gerou o slug — recarrega pra refletir
        location.reload()
      }
    })
  }

  function handleSalvarConfig() {
    setErro(null); setSucesso(false)
    startTransition(async () => {
      const res = await salvarFeedbackConfig({
        mensagemPos: mensagemPos || null,
        brindeMinimoId: brindeMinimoId || null,
        googleReviewUrl: googleUrl || null,
        notaMinimaPositivo: notaMin,
        gamificacaoAtiva: gamif,
        pontosPorFeedback: pontos,
        limiteDiarioPontuavel: limite,
      })
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      setTimeout(() => setSucesso(false), 2000)
    })
  }

  function copiarLink() {
    if (!urlPublica) return
    navigator.clipboard.writeText(urlPublica).catch(() => {})
  }

  function compartilharWA() {
    if (!urlPublica) return
    const txt = encodeURIComponent(`Oi! Deixa seu feedback rapidinho sobre o atendimento aqui na ${barbearia.nome}? Vai que sai brinde 🎁\n${urlPublica}`)
    window.open(`https://wa.me/?text=${txt}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Toggle ativar */}
      <section className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg text-text">Coleta de feedback</h2>
            <p className="text-text-muted text-xs font-sans mt-0.5">
              {ativo ? 'Link público ativo. Compartilhe com clientes.' : 'Desativado. Ative pra gerar o link.'}
            </p>
          </div>
          <button
            type="button" role="switch" aria-checked={ativo}
            onClick={() => handleToggleAtivo(!ativo)}
            disabled={isPending}
            className={[
              'relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-50',
              ativo ? 'bg-primary' : 'bg-surface-2',
            ].join(' ')}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {ativo && slug && (
          <div className="bg-surface-2 border border-border rounded-xl p-3 space-y-2">
            <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Link público</p>
            <p className="font-sans text-sm text-text break-all">{urlPublica}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={copiarLink} className="btn-ghost text-xs py-1.5 px-3 border border-border">📋 Copiar</button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(urlPublica)}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-xs py-1.5 px-3 border border-border"
              >📱 Gerar QR</a>
              <button onClick={compartilharWA} className="btn-ghost text-xs py-1.5 px-3 border border-border">💬 WhatsApp</button>
            </div>
          </div>
        )}
      </section>

      {ativo && (
        <>
          {/* Brindes */}
          <BrindesSection brindes={brindes} />

          {/* Config geral */}
          <section className="card p-4 sm:p-5 space-y-4">
            <h2 className="font-serif text-lg text-text">Configurações</h2>

            <div>
              <label htmlFor="msg" className="label">Mensagem pós-feedback (até 200 caract.)</label>
              <textarea
                id="msg" value={mensagemPos}
                onChange={e => setMensagemPos(e.target.value.slice(0, 200))}
                placeholder="Obrigado pelo feedback! Apresente o código na próxima visita pra resgatar seu brinde."
                rows={3}
                className="input w-full text-sm"
                style={{ resize: 'vertical', minHeight: 70 }}
              />
              <p className="text-text-muted text-[11px] font-sans mt-1">{mensagemPos.length}/200</p>
            </div>

            <div>
              <label htmlFor="brindemin" className="label">Brinde mínimo garantido</label>
              <select
                id="brindemin" value={brindeMinimoId}
                onChange={e => setBrindeMinimoId(e.target.value)}
                className="input w-full"
              >
                <option value="">— Nenhum —</option>
                {brindes.filter(b => b.ativo).map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
              <p className="text-text-muted text-[11px] font-sans mt-1">
                Se o cliente não receber nenhum brinde no sorteio, o sistema atribui esse após 24h.
              </p>
            </div>

            <div>
              <label htmlFor="gurl" className="label">Link de avaliação no Google</label>
              <input
                id="gurl" type="url" value={googleUrl}
                onChange={e => setGoogleUrl(e.target.value)}
                placeholder="https://g.page/r/..."
                className="input w-full text-sm"
              />
            </div>

            <div>
              <label htmlFor="nmin" className="label">Nota mínima para positivo (1–5)</label>
              <input
                id="nmin" type="number" min={1} max={5} value={notaMin}
                onChange={e => setNotaMin(parseInt(e.target.value) || 4)}
                className="input w-24 text-center"
              />
              <p className="text-text-muted text-[11px] font-sans mt-1">
                Feedbacks ≥ {notaMin}★ aparecem com botão pra avaliar no Google. Abaixo, ficam internos.
              </p>
            </div>

            {/* Gamificação */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-sans text-sm text-text">Feedback positivo dá pontos ao barbeiro</p>
                  <p className="text-text-muted text-[11px] font-sans mt-0.5">
                    Concede pontos via campanha (mesma lógica de lançamento de pontos).
                  </p>
                </div>
                <button
                  type="button" role="switch" aria-checked={gamif}
                  onClick={() => setGamif(v => !v)}
                  className={[
                    'relative w-10 h-6 rounded-full shrink-0 transition-colors',
                    gamif ? 'bg-primary' : 'bg-surface-2',
                  ].join(' ')}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${gamif ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {gamif && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="label">Pontos por feedback</label>
                    <input type="number" min={0} value={pontos}
                      onChange={e => setPontos(parseInt(e.target.value) || 0)}
                      className="input w-full text-center" />
                  </div>
                  <div>
                    <label className="label">Limite diário por barbeiro</label>
                    <input type="number" min={0} value={limite}
                      onChange={e => setLimite(parseInt(e.target.value) || 0)}
                      className="input w-full text-center" />
                  </div>
                  <p className="col-span-2 text-text-muted text-[11px] font-sans italic">
                    ⚠️ Desligar o toggle apaga os pontos retroativos concedidos por feedback (e zera o histórico desse contador).
                  </p>
                </div>
              )}
            </div>

            {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
            <button onClick={handleSalvarConfig} disabled={isPending} className="btn-primary w-full text-sm py-2.5">
              {sucesso ? '✓ Salvo!' : isPending ? 'Salvando…' : 'Salvar configurações'}
            </button>
          </section>
        </>
      )}
    </div>
  )
}

function BrindesSection({ brindes }: { brindes: Brinde[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [novoAberto, setNovoAberto] = useState(false)

  // Soma dos pesos dos brindes ATIVOS — usado pelo BrindeForm pra
  // calcular a % de chance dinamicamente quando arrasta o slider.
  const somaPesosAtivos = brindes.filter(b => b.ativo).reduce((s, b) => s + b.peso, 0)

  return (
    <section className="card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-text">Brindes</h2>
        <button onClick={() => { setNovoAberto(true); setEditandoId(null) }} className="btn-ghost text-xs py-1.5 px-3 border border-border">
          + Adicionar brinde
        </button>
      </div>

      {brindes.length === 0 && !novoAberto && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-amber-200 text-xs font-sans">
            ⚠️ Nenhum brinde cadastrado ainda. O cliente não vai receber nada no pós-envio até você adicionar pelo menos um.
          </p>
        </div>
      )}

      {novoAberto && (
        <BrindeForm onClose={() => setNovoAberto(false)} somaPesosOutros={somaPesosAtivos} />
      )}

      {brindes.map(b => {
        const chance = b.ativo && somaPesosAtivos > 0 ? Math.round((b.peso / somaPesosAtivos) * 100) : 0
        return editandoId === b.id ? (
          <BrindeForm
            key={b.id}
            brinde={b}
            onClose={() => setEditandoId(null)}
            // Soma dos pesos dos OUTROS ativos (sem o atual, pra não contar 2x).
            somaPesosOutros={somaPesosAtivos - (b.ativo ? b.peso : 0)}
          />
        ) : (
          <BrindeRow key={b.id} brinde={b} chance={chance} onEdit={() => setEditandoId(b.id)} />
        )
      })}
    </section>
  )
}

function BrindeRow({ brinde, chance, onEdit }: { brinde: Brinde; chance: number; onEdit: () => void }) {
  const [, startTransition] = useTransition()
  function handleExcluir() {
    if (!confirm(`Excluir o brinde "${brinde.nome}"?`)) return
    startTransition(async () => { await excluirBrinde(brinde.id) })
  }
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${brinde.ativo ? 'bg-surface-2' : 'bg-surface-2 opacity-60'}`}>
      {brinde.foto_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brinde.foto_url} alt={brinde.nome} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center shrink-0 text-xl">🎁</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-text truncate">{brinde.nome}</p>
        <p className="text-text-muted text-[11px] font-sans">
          {brinde.ativo
            ? <>Peso {brinde.peso} · <span className="text-primary font-semibold">{chance}% de chance</span>{brinde.descricao ? ` · ${brinde.descricao}` : ''}</>
            : <>Peso {brinde.peso} · Inativo{brinde.descricao ? ` · ${brinde.descricao}` : ''}</>}
        </p>
      </div>
      <button onClick={onEdit} className="btn-ghost text-xs py-1 px-2 border border-border shrink-0">Editar</button>
      <button onClick={handleExcluir} className="text-red-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function BrindeForm({
  brinde, onClose, somaPesosOutros,
}: {
  brinde?: Brinde
  onClose: () => void
  somaPesosOutros: number   // soma de pesos dos outros brindes ATIVOS
}) {
  const [nome, setNome] = useState(brinde?.nome ?? '')
  const [descricao, setDescricao] = useState(brinde?.descricao ?? '')
  const [fotoUrl, setFotoUrl] = useState(brinde?.foto_url ?? '')
  const [peso, setPeso] = useState(brinde?.peso ?? 10)
  const [ativo, setAtivo] = useState(brinde?.ativo ?? true)

  // % de chance no sorteio: só se ativo. Soma do denominador inclui esse peso.
  const denominador = somaPesosOutros + (ativo ? peso : 0)
  const chance = ativo && denominador > 0 ? Math.round((peso / denominador) * 100) : 0
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    setErro(null)
    startTransition(async () => {
      const res = await salvarBrinde({
        id: brinde?.id, nome, descricao: descricao || null,
        fotoUrl: fotoUrl || null, peso, ativo,
      })
      if (res?.error) { setErro(res.error); return }
      onClose()
    })
  }

  return (
    <div className="bg-surface-2 border border-primary/30 rounded-xl p-3 space-y-3">
      <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">
        {brinde ? 'Editar brinde' : 'Novo brinde'}
      </p>
      <div>
        <label className="label">Nome *</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Brinde da casa" className="input w-full text-sm" />
      </div>
      <div>
        <label className="label">Descrição (opcional)</label>
        <input value={descricao} onChange={e => setDescricao(e.target.value)} className="input w-full text-sm" />
      </div>
      <div>
        <label className="label">URL da foto (opcional)</label>
        <input value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://..." className="input w-full text-sm" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label !mb-0">Peso (raridade)</label>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-[11px] font-sans">peso {peso}</span>
            {ativo && (
              <span className="text-primary text-[11px] font-sans font-semibold">
                {chance}% de chance
              </span>
            )}
          </div>
        </div>
        <input
          type="range" min={1} max={100} value={peso}
          onChange={e => setPeso(parseInt(e.target.value) || 1)}
          className="w-full accent-primary cursor-pointer"
        />
        <p className="text-text-muted text-[11px] font-sans mt-1">
          Arraste pra ajustar. Maior peso = mais comum no sorteio entre os brindes ativos.
        </p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 accent-primary" />
        <span className="text-sm font-sans text-text">Ativo</span>
      </label>
      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1 text-sm py-2" disabled={isPending}>Cancelar</button>
        <button onClick={salvar} disabled={isPending} className="btn-primary flex-1 text-sm py-2">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
