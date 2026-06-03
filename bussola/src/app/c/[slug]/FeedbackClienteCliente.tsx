'use client'

import { useRef, useState } from 'react'
import { Check, Gift, Star, AlertTriangle, Info, Copy, ChevronRight, CheckCircle2, Heart } from 'lucide-react'
import Avatar from '@/components/Avatar'

export interface ColaboradorLite {
  id: string
  nome: string
  foto_url: string | null
}

interface Props {
  slug: string
  nomeEmpresa: string
  logoUrl?: string | null
  colaboradores: ColaboradorLite[]
  mensagemPosFeedback: string
  temBrindes: boolean
}

const LABELS_ESTRELAS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']

interface Resultado {
  feedback_id?: string
  ganhou_brinde: boolean
  brinde: { nome: string; descricao: string | null; codigo_resgate: string; validade_dias?: number } | null
  google_reviews?: { url: string } | null
  comentario_enviado?: string
}

export default function FeedbackClienteCliente({ slug, nomeEmpresa, logoUrl, colaboradores, mensagemPosFeedback, temBrindes }: Props) {
  const [estrelas, setEstrelas] = useState<number>(0)
  const [colabId, setColabId] = useState<string | null>(null) // null = nenhum / vários
  const [colabEscolhido, setColabEscolhido] = useState(false) // marca que passou desse passo
  const [comentario, setComentario] = useState('')
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  async function enviar() {
    if (!estrelas) return
    // Identificação obrigatória quando há comentário: nome + sobrenome
    // são usados pra entregar o brinde.
    if (comentario.trim() && (!nome.trim() || !sobrenome.trim())) {
      setErro('Informe nome e sobrenome pra receber o brinde.')
      return
    }
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
          nome_cliente:
            comentario.trim() && nome.trim() && sobrenome.trim()
              ? `${nome.trim()} ${sobrenome.trim()}`
              : null,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setErro(j?.error ?? 'Não foi possível enviar.')
        setEnviando(false)
        return
      }
      setResultado({
        feedback_id: j.feedback_id,
        ganhou_brinde: !!j.ganhou_brinde,
        brinde: j.brinde ?? null,
        google_reviews: j.google_reviews ?? null,
        comentario_enviado: comentario.trim(),
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
        <header className="text-center flex flex-col items-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={nomeEmpresa}
              loading="eager"
              className="w-20 h-20 rounded-full object-cover bg-linho border border-border mb-3"
            />
          )}
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

        {/* PASSO 4 — IDENTIFICAÇÃO (obrigatória pra receber o brinde) */}
        {mostrarIdentificacao && (
          <section className="animate-fade-in space-y-2">
            <div>
              <p className="text-sm text-text">Pra receber o brinde, informe seu nome completo:</p>
              <p className="text-xs text-chumbo mt-0.5">Usamos só pra confirmar o ganhador na empresa.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="nome-cliente"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, 40))}
                placeholder="Nome"
                autoComplete="given-name"
                className="input text-sm"
              />
              <input
                id="sobrenome-cliente"
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value.slice(0, 40))}
                placeholder="Sobrenome"
                autoComplete="family-name"
                className="input text-sm"
              />
            </div>
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

        <footer className="pt-4 text-center">
          <a
            href="https://bussolameet.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-simbolo-transparente.svg" alt="" width={14} height={14} />
            <span className="text-xs text-chumbo">Powered by Bússola</span>
          </a>
        </footer>
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

type EtapaResultado = 'brinde' | 'google' | 'final-google' | 'final-recusou'

function TelaResultado({
  nomeEmpresa,
  mensagem,
  resultado,
}: {
  nomeEmpresa: string
  mensagem: string
  resultado: Resultado
}) {
  const { ganhou_brinde, brinde, google_reviews, comentario_enviado, feedback_id } = resultado
  const mensagemFinal = mensagem || 'Obrigado pelo seu feedback! Sua opinião nos ajuda a melhorar.'
  const podeOferecerGoogle = !!google_reviews?.url && !!comentario_enviado
  const [etapa, setEtapa] = useState<EtapaResultado>('brinde')

  if (etapa === 'google' && podeOferecerGoogle && google_reviews) {
    return (
      <TelaGoogle
        nomeEmpresa={nomeEmpresa}
        comentario={comentario_enviado!}
        googleUrl={google_reviews.url}
        feedbackId={feedback_id}
        onConcluir={() => setEtapa('final-google')}
        onRecusar={() => setEtapa('final-recusou')}
      />
    )
  }

  if (etapa === 'final-google') {
    return (
      <TelaFinal
        icon={<CheckCircle2 size={72} strokeWidth={1.5} color="#5C7148" className="mx-auto" />}
        titulo="Obrigado!"
        texto="O Google abriu numa nova aba. Cole o comentário lá e publique. Muito obrigado por ajudar!"
      />
    )
  }
  if (etapa === 'final-recusou') {
    return (
      <TelaFinal
        icon={<Heart size={56} strokeWidth={1.5} color="#A56336" className="mx-auto" />}
        titulo="Obrigado pela sua avaliação!"
        texto="Sua opinião é muito importante pra gente."
      />
    )
  }

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
              Mostre este código na <strong>{nomeEmpresa}</strong> pra usar seu brinde,
              em até <strong>{brinde.validade_dias ?? 30} dias</strong>.
            </p>

            <div className="border-t border-border pt-4 mt-6 space-y-1.5 text-[12px] text-chumbo">
              <p className="inline-flex items-center justify-center gap-1.5">
                <Info size={13} strokeWidth={1.5} />
                Brinde válido por {brinde.validade_dias ?? 30} dias
              </p>
              <p>· Não acumulável com outras avaliações</p>
              <p>· Uso individual</p>
            </div>

            <p className="text-xs text-chumbo border-t border-border pt-4">
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

        {podeOferecerGoogle && (
          <button
            type="button"
            onClick={() => setEtapa('google')}
            className="btn-primary w-full"
          >
            Continuar <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </main>
  )
}

function TelaGoogle({
  nomeEmpresa,
  comentario,
  googleUrl,
  feedbackId,
  onConcluir,
  onRecusar,
}: {
  nomeEmpresa: string
  comentario: string
  googleUrl: string
  feedbackId?: string
  onConcluir: () => void
  onRecusar: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const [erroCopia, setErroCopia] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function copiar() {
    setErroCopia(false)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(comentario)
      } else {
        // Fallback: seleciona o textarea pra cópia manual.
        inputRef.current?.select()
        document.execCommand?.('copy')
      }
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErroCopia(true)
      inputRef.current?.select()
    }
  }

  function abrirGoogle() {
    if (feedbackId) {
      // Tracking best-effort, não bloqueia o redirect.
      fetch('/api/feedback-cliente/clicou-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId }),
        keepalive: true,
      }).catch(() => {})
    }
    window.open(googleUrl, '_blank', 'noopener,noreferrer')
    onConcluir()
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <Star size={56} strokeWidth={1.5} color="#8B6F47" className="mx-auto" fill="#8B6F47" />
        <div className="space-y-2">
          <h1 className="font-serif text-2xl text-preto">Sua avaliação foi incrível!</h1>
          <p className="text-sm text-grafite px-2">
            Você toparia compartilhar essa mesma opinião no Google? Ajudaria muito a{' '}
            <strong>{nomeEmpresa}</strong> a ser encontrada por mais pessoas.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-marrom bg-linho/50 p-4 text-left">
          <p className="text-marrom text-2xl leading-none mb-1" aria-hidden>“</p>
          <p className="text-text italic text-sm whitespace-pre-wrap">{comentario}</p>
          <textarea
            ref={inputRef}
            value={comentario}
            readOnly
            className="sr-only"
            aria-hidden
          />
        </div>

        <button
          type="button"
          onClick={copiar}
          className="btn-secondary w-full"
        >
          {copiado ? <><Check size={16} strokeWidth={1.5} /> Copiado</> : <><Copy size={16} strokeWidth={1.5} /> Copiar comentário</>}
        </button>
        {erroCopia && (
          <p className="text-xs text-vinho">
            Copiar automático falhou. Toque no comentário acima pra copiar manualmente.
          </p>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={abrirGoogle}
            className="btn-primary w-full min-h-[44px]"
          >
            Avaliar no Google
          </button>
          <button
            type="button"
            onClick={onRecusar}
            className="text-sm text-grafite hover:text-text underline"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </main>
  )
}

function TelaFinal({
  icon,
  titulo,
  texto,
}: {
  icon: React.ReactNode
  titulo: string
  texto: string
}) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-5 animate-fade-in">
        {icon}
        <h1 className="text-xl font-semibold text-text">{titulo}</h1>
        <p className="text-sm text-grafite px-4">{texto}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="btn-secondary"
        >
          Fechar
        </button>
      </div>
    </main>
  )
}
