'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { enviarMensagemSuporte, marcarSuporteLido, marcarComunicadosLidos } from './actions'

export type ComunicadoExibido = {
  id: string
  texto: string
  publicadoEm: string
  lido: boolean
}

export type MensagemSuporte = {
  id: string
  autor: 'cliente' | 'admin'
  corpo: string
  criadoEm: string
  lido: boolean
}

const LIMITE = 4000

function quando(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

function dia(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

type Aba = 'comunicados' | 'suporte'

export default function ChatClient({
  comunicados,
  mensagens,
  avisoResposta,
}: {
  comunicados: ComunicadoExibido[]
  mensagens: MensagemSuporte[]
  avisoResposta: string
}) {
  const naoLidosComunicados = useMemo(() => comunicados.filter(c => !c.lido).length, [comunicados])
  const naoLidasRespostas = useMemo(
    () => mensagens.filter(m => m.autor === 'admin' && !m.lido).length,
    [mensagens],
  )

  // Abre direto no que tem novidade: quem recebeu resposta quer ver a resposta.
  const [aba, setAba] = useState<Aba>(naoLidasRespostas > 0 ? 'suporte' : 'comunicados')
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, startTransition] = useTransition()
  const fimRef = useRef<HTMLDivElement | null>(null)

  // Marcar como lido é efeito de ABRIR a aba, não de carregar a página: quem
  // nunca abriu o suporte não deve perder o indicador de resposta nova.
  useEffect(() => {
    if (aba === 'comunicados' && naoLidosComunicados > 0) {
      const ids = comunicados.filter(c => !c.lido).map(c => c.id)
      marcarComunicadosLidos(ids).catch(() => {})
    }
    if (aba === 'suporte' && naoLidasRespostas > 0) {
      marcarSuporteLido().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba])

  useEffect(() => {
    if (aba === 'suporte') fimRef.current?.scrollIntoView({ block: 'end' })
  }, [aba, mensagens.length])

  function enviar() {
    const corpo = texto.trim()
    if (!corpo || pendente) return
    setErro(null)
    startTransition(async () => {
      const r = await enviarMensagemSuporte(corpo)
      if (r.error) setErro(r.error)
      else setTexto('')
    })
  }

  return (
    <div className="space-y-5">
      {/* Abas — as duas naturezas nunca se misturam na mesma lista. */}
      <div className="flex gap-2">
        {([
          ['comunicados', 'Comunicados', naoLidosComunicados],
          ['suporte', 'Falar com o suporte', naoLidasRespostas],
        ] as const).map(([id, rotulo, badge]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              aba === id
                ? 'border-primary/60 bg-primary/10 text-text'
                : 'border-border text-text-muted hover:text-text'
            }`}
          >
            {rotulo}
            {badge > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'comunicados' ? (
        <section className="space-y-3">
          <p className="text-xs leading-relaxed text-text-muted">
            Recados do BarberMeta pra você. Se quiser falar comigo, use a aba{' '}
            <button type="button" onClick={() => setAba('suporte')} className="text-primary underline underline-offset-2">
              Falar com o suporte
            </button>.
          </p>

          {comunicados.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-text-muted">Nenhum comunicado ainda. Assim que eu publicar algo, aparece aqui.</p>
            </div>
          ) : (
            comunicados.map((c) => (
              <article key={c.id} className={`card p-5 ${!c.lido ? 'border-primary/40' : ''}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {dia(c.publicadoEm)}
                  </span>
                  {!c.lido && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                      Novo
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{c.texto}</p>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {/* O combinado fica escrito na tela — é o que evita a cobrança de
              resposta imediata sem precisar responder imediatamente. */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Tempo de resposta</p>
            <p className="mt-1 text-sm leading-relaxed text-text">{avisoResposta}</p>
          </div>

          <div className="card max-h-[52vh] space-y-3 overflow-y-auto p-5">
            {mensagens.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                Nenhuma mensagem ainda. Escreva sua dúvida abaixo que eu respondo por aqui.
              </p>
            ) : (
              mensagens.map((m) => {
                const meu = m.autor === 'cliente'
                return (
                  <div key={m.id} className={`flex ${meu ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      meu ? 'bg-primary/15 text-text' : 'border border-border bg-surface-2 text-text'
                    }`}>
                      {!meu && (
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                          Suporte BarberMeta
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.corpo}</p>
                      <p className="mt-1.5 text-[10px] text-text-muted">{quando(m.criadoEm)}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={fimRef} />
          </div>

          {erro && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-3 text-sm text-red-200">{erro}</div>
          )}

          <div className="space-y-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar()
              }}
              rows={3}
              placeholder="Escreva sua dúvida…"
              className="input w-full resize-y text-[16px]"
              style={{ fontSize: '16px' }}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted">{texto.length}/{LIMITE}</span>
              <button
                type="button"
                onClick={enviar}
                disabled={pendente || texto.trim().length === 0}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {pendente ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
