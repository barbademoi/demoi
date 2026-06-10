'use client'

import { useState, useTransition } from 'react'
import { enviarFeedback } from './actions'

interface Barbeiro { id: string; nome: string; foto_url: string | null }

const LABELS_ESTRELAS = ['', 'Péssimo', 'Ruim', 'Ok', 'Bom', 'Excelente']

interface Brinde {
  nome: string
  descricao: string | null
  foto_url: string | null
  codigo_resgate: string
  validade_dias: number
}

interface SucessoState {
  brinde: Brinde | null
  mensagemPos: string | null
  ehPositivo: boolean
  googleReviewUrl: string | null
}

export default function FeedbackClienteForm({ slug, barbeiros }: { slug: string; barbeiros: Barbeiro[] }) {
  const [estrelas, setEstrelas] = useState(0)
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)  // null = "Não lembro"
  const [comentario, setComentario] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<SucessoState | null>(null)
  const [isPending, startTransition] = useTransition()

  function enviar() {
    setErro(null)
    if (estrelas < 1) { setErro('Selecione uma nota.'); return }
    const nomeTrim = nome.trim()
    if (!nomeTrim) { setErro('Preencha seu nome pra receber o brinde.'); return }
    startTransition(async () => {
      const res = await enviarFeedback({
        slug, estrelas, barbeiroId,
        comentario: comentario || null,
        nomeCliente: nomeTrim,
        contatoCliente: null,
      })
      if ('error' in res) { setErro(res.error); return }
      setSucesso({
        brinde: res.brinde, mensagemPos: res.mensagemPos,
        ehPositivo: res.ehPositivo, googleReviewUrl: res.googleReviewUrl,
      })
    })
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div className="card p-6 space-y-5">
        {sucesso.brinde && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 text-center space-y-3">
            {sucesso.brinde.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sucesso.brinde.foto_url} alt={sucesso.brinde.nome} className="w-24 h-24 rounded-xl object-cover mx-auto" />
            ) : (
              <p className="text-5xl">🎁</p>
            )}
            <div>
              <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Seu brinde</p>
              <p className="font-serif text-2xl text-text">{sucesso.brinde.nome}</p>
              {sucesso.brinde.descricao && <p className="text-text-muted text-sm font-sans mt-1">{sucesso.brinde.descricao}</p>}
            </div>
            <div className="bg-surface border border-border rounded-xl py-3">
              <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Código de resgate</p>
              <p className="font-serif text-3xl text-primary tracking-widest mt-1">{sucesso.brinde.codigo_resgate}</p>
            </div>
            <p className="text-text text-sm font-sans">
              Apresente este código na barbearia em até <strong>{sucesso.brinde.validade_dias} dias</strong> pra usar seu brinde.
            </p>
            <div className="border-t border-border pt-3 mt-2 space-y-1 text-[12px] text-text-muted font-sans">
              <p>· Válido por {sucesso.brinde.validade_dias} dias</p>
              <p>· Não acumulável com outras avaliações</p>
              <p>· Uso individual</p>
            </div>
            <p className="text-text-muted text-[11px] font-sans italic">
              📸 Tira print pra apresentar quando for resgatar.
            </p>
          </div>
        )}

        {!sucesso.brinde && (
          <div className="text-center py-2">
            <p className="text-3xl">🙏</p>
            <p className="font-serif text-lg text-text mt-2">Obrigado!</p>
          </div>
        )}

        {sucesso.mensagemPos && (
          <p className="text-text-muted text-sm font-sans text-center leading-relaxed whitespace-pre-line">
            {sucesso.mensagemPos}
          </p>
        )}

        {/* Passo OPCIONAL separado: avaliar no Google (sem prometer brinde
            em troca — política do Google proíbe review incentivado, e o
            brinde já foi entregue acima pelo comentário interno). */}
        {sucesso.ehPositivo && sucesso.googleReviewUrl && (
          <div className="border-t border-border pt-4 space-y-2 text-center">
            <p className="text-text-muted text-xs font-sans">
              Quer dar uma força extra pra barbearia?
            </p>
            <a
              href={sucesso.googleReviewUrl}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full text-sm py-3 inline-flex items-center justify-center gap-2"
            >
              ⭐ Avaliar no Google
            </a>
          </div>
        )}
      </div>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────────────
  return (
    <div className="card p-5 sm:p-6 space-y-6">
      {/* Passo 1: Estrelas */}
      <div>
        <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-3">Sua avaliação</p>
        <div className="flex items-center justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setEstrelas(n)}
              className={`text-4xl sm:text-5xl transition-transform active:scale-95 ${n <= estrelas ? 'text-yellow-400' : 'text-text-muted/30'}`}
              aria-label={`${n} estrelas`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-center text-text-muted text-sm font-sans h-5">
          {estrelas > 0 ? LABELS_ESTRELAS[estrelas] : ''}
        </p>
      </div>

      {/* Passo 2: Quem te atendeu */}
      {barbeiros.length > 0 && (
        <div>
          <label className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2 block">
            Quem te atendeu? <span className="normal-case text-[11px]">(opcional)</span>
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {barbeiros.map(b => (
              <button
                key={b.id} type="button"
                onClick={() => setBarbeiroId(b.id === barbeiroId ? null : b.id)}
                className={`flex flex-col items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-xl transition-all
                  ${b.id === barbeiroId ? 'bg-primary/10 border border-primary' : 'border border-transparent hover:bg-surface-2'}`}
              >
                {b.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.foto_url} alt={b.nome} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center font-serif text-xl text-text-muted">
                    {b.nome[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] font-sans text-text truncate max-w-16">{b.nome.split(' ')[0]}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBarbeiroId(null)}
              className={`flex flex-col items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-xl border transition-all
                ${barbeiroId === null ? 'bg-primary/10 border-primary' : 'border-border bg-surface-2'}`}
            >
              <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-xl">🤷</div>
              <span className="text-[11px] font-sans text-text whitespace-nowrap">Não lembro</span>
            </button>
          </div>
        </div>
      )}

      {/* Passo 3: Comentário (opcional, com incentivo do brinde em destaque) */}
      <div>
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-2 flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <p className="text-sm font-sans text-text">
            <span className="font-semibold">Deixe um comentário e ganhe um brinde da empresa</span>
          </p>
        </div>
        <label className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2 block" htmlFor="cmt">
          Conta pra gente como foi <span className="normal-case text-[11px]">(opcional)</span>
        </label>
        <textarea
          id="cmt" value={comentario}
          onChange={e => setComentario(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Quanto mais detalhe, melhor pra gente melhorar."
          className="input w-full text-sm"
          style={{ resize: 'vertical', minHeight: 80 }}
        />
        <p className="text-text-muted text-[11px] font-sans mt-1 text-right">{comentario.length}/500</p>
      </div>

      {/* Passo 4: Identificação — APENAS nome + sobrenome, obrigatório
          (necessário pra emitir o brinde). Sem WhatsApp/email. */}
      <div>
        <label className="text-text-muted text-xs font-sans uppercase tracking-wide mb-2 block" htmlFor="nm">
          Nome e sobrenome <span className="text-red-400 normal-case">*</span>
        </label>
        <input
          id="nm" value={nome}
          onChange={e => setNome(e.target.value.slice(0, 80))}
          placeholder="Ex: João Silva"
          className="input w-full text-sm"
          required
        />
        <p className="text-text-muted text-[11px] font-sans mt-1">
          Necessário pra emitir o brinde.
        </p>
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}

      <button
        onClick={enviar} disabled={isPending || estrelas < 1 || !nome.trim()}
        className="btn-primary w-full text-sm py-3"
      >
        {isPending ? 'Enviando…' : 'Enviar feedback'}
      </button>
    </div>
  )
}
