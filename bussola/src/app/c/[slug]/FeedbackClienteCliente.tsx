'use client'

import { useState } from 'react'
import { Check, Gift, Star, AlertTriangle } from 'lucide-react'
import Avatar from '@/components/Avatar'

export interface ColaboradorLite {
  id: string
  nome: string
  foto_url: string | null
}

interface Props {
  slug: string
  nomeEmpresa: string
  colaboradores: ColaboradorLite[]
  mensagemPosFeedback: string
  temBrindes: boolean
}

const LABELS_ESTRELAS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']

interface Resultado {
  ganhou_brinde: boolean
  brinde: { nome: string; descricao: string | null; codigo_resgate: string } | null
}

export default function FeedbackClienteCliente({ slug, nomeEmpresa, colaboradores, mensagemPosFeedback, temBrindes }: Props) {
  const [estrelas, setEstrelas] = useState<number>(0)
  const [colabId, setColabId] = useState<string | null>(null) // null = nenhum / vários
  const [colabEscolhido, setColabEscolhido] = useState(false) // marca que passou desse passo
  const [comentario, setComentario] = useState('')
  const [anonimo, setAnonimo] = useState(true)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  async function enviar() {
    if (!estrelas) return
    setErro(null)
    setEnviando(true)
    try {
      const r = await fetch('/api/feedback-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          estrelas,
          colaborador_id: colabId,
          comentario: comentario.trim() || null,
          nome_cliente: !anonimo && nome.trim() ? nome.trim() : null,
          contato_cliente: !anonimo && contato.trim() ? contato.trim() : null,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setErro(j?.error ?? 'Não foi possível enviar.')
        setEnviando(false)
        return
      }
      setResultado({
        ganhou_brinde: !!j.ganhou_brinde,
        brinde: j.brinde ?? null,
      })
    } catch {
      setErro('Sem conexão. Tente de novo.')
    }
    setEnviando(false)
  }

  // TELA DE RESULTADO
  if (resultado) {
    return <TelaResultado nomeEmpresa={nomeEmpresa} mensagem={mensagemPosFeedback} resultado={resultado} />
  }

  const mostrarColab = estrelas > 0
  const mostrarComentario = mostrarColab && colabEscolhido
  const mostrarIdentificacao = mostrarComentario && comentario.trim().length > 0
  const podeEnviar = estrelas > 0 && !enviando

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* TOPO */}
        <header className="text-center">
          <p className="font-serif text-2xl text-preto">{nomeEmpresa}</p>
          <p className="text-chumbo text-sm mt-1">Como foi seu atendimento?</p>
        </header>

        {/* PASSO 1 — ESTRELAS */}
        <section>
          <SelecionarEstrelas valor={estrelas} onChange={setEstrelas} />
          {estrelas > 0 && (
            <p className="text-center text-text font-medium mt-2 animate-fade-in">{LABELS_ESTRELAS[estrelas]}</p>
          )}
        </section>

        {/* PASSO 2 — COLABORADOR */}
        {mostrarColab && (
          <section className="animate-fade-in">
            <p className="text-sm text-text mb-2">Quem te atendeu? <span className="text-chumbo font-normal">(opcional)</span></p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              <button
                type="button"
                onClick={() => { setColabId(null); setColabEscolhido(true) }}
                className={[
                  'flex flex-col items-center gap-1.5 shrink-0 w-[80px] snap-start',
                ].join(' ')}
              >
                <span className={[
                  'w-14 h-14 rounded-full border-2 flex items-center justify-center bg-linho text-grafite text-xs leading-tight',
                  colabEscolhido && colabId === null ? 'border-marrom' : 'border-transparent',
                ].join(' ')}>
                  Não lembro / vários
                </span>
                <span className="text-xs text-text text-center">—</span>
              </button>
              {colaboradores.map((c) => {
                const sel = colabId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setColabId(c.id); setColabEscolhido(true) }}
                    className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] snap-start"
                  >
                    <span
                      className={[
                        'rounded-full p-0.5 border-2 transition-colors relative',
                        sel ? 'border-marrom' : 'border-transparent',
                      ].join(' ')}
                    >
                      <Avatar nome={c.nome} fotoUrl={c.foto_url} size={56} />
                      {sel && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-marrom text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check size={12} strokeWidth={2} />
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-text text-center leading-tight line-clamp-2">
                      {c.nome.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
            {!colabEscolhido && (
              <button type="button" onClick={() => setColabEscolhido(true)} className="text-xs text-marrom mt-1">
                Pular esse passo
              </button>
            )}
          </section>
        )}

        {/* PASSO 3 — COMENTÁRIO */}
        {mostrarComentario && (
          <section className="animate-fade-in">
            {temBrindes && (
              <div className="rounded-md border-l-[3px] border-marrom bg-linho p-3 mb-3 inline-flex items-start gap-2">
                <Gift size={18} strokeWidth={1.5} color="#8B6F47" className="shrink-0 mt-0.5" />
                <p className="text-sm text-grafite">
                  <span className="font-semibold text-marrom">Quem deixa comentário ganha um brinde da empresa.</span>{' '}
                  Conte sua experiência abaixo pra concorrer.
                </p>
              </div>
            )}
            <p className="text-sm text-text mb-2">Quer deixar um comentário? <span className="text-chumbo font-normal">(opcional)</span></p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Conte mais sobre sua experiência…"
              className="input resize-none"
            />
            <p className="text-xs text-chumbo mt-1 text-right">{comentario.length}/500</p>
          </section>
        )}

        {/* PASSO 4 — IDENTIFICAÇÃO */}
        {mostrarIdentificacao && (
          <section className="animate-fade-in space-y-2">
            <p className="text-sm text-text">Quer se identificar? <span className="text-chumbo font-normal">(opcional)</span></p>
            <label className="flex items-center gap-2 text-sm text-grafite">
              <input
                type="checkbox"
                checked={anonimo}
                onChange={(e) => setAnonimo(e.target.checked)}
                className="accent-marrom w-4 h-4"
              />
              Prefiro permanecer anônimo
            </label>
            {!anonimo && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value.slice(0, 80))}
                  placeholder="Seu nome"
                  className="input text-sm"
                />
                <input
                  type="text"
                  value={contato}
                  onChange={(e) => setContato(e.target.value.slice(0, 80))}
                  placeholder="WhatsApp ou email"
                  className="input text-sm"
                />
              </div>
            )}
          </section>
        )}

        {erro && (
          <p className="inline-flex items-center gap-1.5 text-vinho text-sm">
            <AlertTriangle size={14} strokeWidth={1.5} /> {erro}
          </p>
        )}

        <button
          type="button"
          onClick={enviar}
          disabled={!podeEnviar}
          className="btn-primary w-full"
        >
          {enviando ? 'Enviando…' : 'Enviar feedback'}
        </button>
      </div>
    </main>
  )
}

function SelecionarEstrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const ativo = n <= valor
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            className="p-1"
          >
            <Star
              size={44}
              strokeWidth={1.5}
              color="#8B6F47"
              fill={ativo ? '#8B6F47' : 'transparent'}
            />
          </button>
        )
      })}
    </div>
  )
}

function TelaResultado({
  nomeEmpresa,
  mensagem,
  resultado,
}: {
  nomeEmpresa: string
  mensagem: string
  resultado: Resultado
}) {
  const { ganhou_brinde, brinde } = resultado
  const mensagemFinal = mensagem || 'Obrigado pelo seu feedback! Sua opinião nos ajuda a melhorar.'

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        {ganhou_brinde && brinde ? (
          <>
            <Gift size={72} strokeWidth={1.5} color="#8B6F47" className="mx-auto" />
            <p className="text-sm text-chumbo">Você ganhou:</p>
            <div className="rounded-lg border-2 border-marrom bg-linho p-6 space-y-3">
              <p className="font-serif text-2xl text-preto">{brinde.nome}</p>
              {brinde.descricao && (
                <p className="text-sm text-grafite">{brinde.descricao}</p>
              )}
              <div className="bg-surface border border-border rounded-md p-4 mt-3">
                <p className="text-[11px] text-chumbo uppercase tracking-wide mb-1">Código de resgate</p>
                <p className="font-mono text-4xl font-bold text-marrom tracking-widest">{brinde.codigo_resgate}</p>
              </div>
            </div>
            <p className="text-sm text-text">
              Mostre este código na <strong>{nomeEmpresa}</strong> pra usar seu brinde.
            </p>
            <p className="text-xs text-chumbo">
              Sugestão: tire um print desta tela pra não perder o código.
            </p>
          </>
        ) : (
          <>
            <Check size={72} strokeWidth={1.5} color="#5C7148" className="mx-auto" />
            <p className="text-lg font-semibold text-text">Obrigado pelo seu feedback!</p>
            <p className="text-sm text-grafite px-4">{mensagemFinal}</p>
          </>
        )}
      </div>
    </main>
  )
}
