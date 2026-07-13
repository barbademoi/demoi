'use client'

import { useState, useTransition } from 'react'
import { gerarPautaReuniao, criarNota, atualizarNota, removerNota } from './actions'

export interface NotaInicial {
  id: string
  texto: string
  feito: boolean
  ordem: number
}

export default function ReuniaoClient({
  temDados,
  notasIniciais,
}: {
  temDados: boolean
  notasIniciais: NotaInicial[]
}) {
  // ── Pauta por IA ──
  const [pauta, setPauta] = useState('')
  const [erroIA, setErroIA] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [gerando, startGerar] = useTransition()

  function handleGerar() {
    setErroIA(null); setCopiado(false)
    startGerar(async () => {
      const r = await gerarPautaReuniao()
      if ('error' in r) { setErroIA(r.error); return }
      setPauta(r.texto)
    })
  }

  function copiar() {
    navigator.clipboard.writeText(pauta).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }).catch(() => {})
  }

  // ── Anotações / checklist ──
  const [notas, setNotas] = useState<NotaInicial[]>(notasIniciais)
  const [novo, setNovo] = useState('')
  const [erroNota, setErroNota] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState('')
  const [, startNota] = useTransition()

  function addNota(e: React.FormEvent) {
    e.preventDefault()
    const texto = novo.trim()
    if (!texto) return
    setErroNota(null)
    setNovo('')
    startNota(async () => {
      const r = await criarNota(texto)
      if ('error' in r) { setErroNota(r.error); setNovo(texto); return }
      setNotas(prev => [...prev, r.nota])
    })
  }

  function toggle(n: NotaInicial) {
    const novoFeito = !n.feito
    setNotas(prev => prev.map(x => x.id === n.id ? { ...x, feito: novoFeito } : x))
    startNota(async () => {
      const r = await atualizarNota(n.id, { feito: novoFeito })
      if ('error' in r) { setErroNota(r.error); setNotas(prev => prev.map(x => x.id === n.id ? { ...x, feito: n.feito } : x)) }
    })
  }

  function salvarEdicao(id: string) {
    const texto = editTexto.trim()
    if (!texto) { setEditId(null); return }
    setNotas(prev => prev.map(x => x.id === id ? { ...x, texto } : x))
    setEditId(null)
    startNota(async () => {
      const r = await atualizarNota(id, { texto })
      if ('error' in r) setErroNota(r.error)
    })
  }

  function remover(id: string) {
    const antes = notas
    setNotas(prev => prev.filter(x => x.id !== id))
    startNota(async () => {
      const r = await removerNota(id)
      if ('error' in r) { setErroNota(r.error); setNotas(antes) }
    })
  }

  return (
    <>
      {/* ── PAUTA POR IA ── */}
      <section className="card p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-serif text-lg text-text">🤖 Pauta com IA</h2>
          <button
            onClick={handleGerar}
            disabled={gerando || !temDados}
            className="btn-primary text-sm py-2 px-4 shrink-0 disabled:opacity-50"
          >
            {gerando ? 'Gerando…' : pauta ? 'Gerar de novo' : 'Gerar pauta'}
          </button>
        </div>
        <p className="text-text-muted text-xs font-sans leading-relaxed mb-3">
          Sugestão <span className="font-semibold">gerada por IA sobre os números reais</span> apurados acima. Revise antes de usar.
        </p>

        {erroIA && <p className="text-red-400 text-sm font-sans mb-3">{erroIA}</p>}

        {pauta && (
          <>
            <textarea
              value={pauta}
              onChange={e => setPauta(e.target.value)}
              rows={14}
              className="input w-full font-sans text-sm leading-relaxed"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={copiar} className="btn-ghost text-sm py-2 px-4 border border-border">
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(pauta)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm py-2 px-4 border border-border"
              >
                Enviar no WhatsApp
              </a>
            </div>
          </>
        )}
      </section>

      {/* ── ANOTAÇÕES / CHECKLIST ── */}
      <section className="card p-6">
        <h2 className="font-serif text-lg text-text mb-1">📝 Anotações da reunião</h2>
        <p className="text-text-muted text-xs font-sans mb-4">
          Sua lista de tópicos — marque conforme for tratando. Salva automaticamente, só você vê.
        </p>

        <form onSubmit={addNota} className="flex items-center gap-2 mb-4">
          <input
            value={novo}
            onChange={e => setNovo(e.target.value)}
            placeholder="Adicionar item…"
            maxLength={500}
            className="input flex-1 text-sm"
          />
          <button type="submit" className="btn-primary text-sm py-2 px-4 shrink-0">Adicionar</button>
        </form>

        {erroNota && <p className="text-red-400 text-sm font-sans mb-3">{erroNota}</p>}

        {notas.length === 0 ? (
          <p className="text-text-muted text-sm font-sans py-2">Nenhuma anotação ainda.</p>
        ) : (
          <ul className="space-y-1.5">
            {notas.map(n => (
              <li key={n.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-surface-2">
                <button
                  type="button"
                  onClick={() => toggle(n)}
                  role="checkbox"
                  aria-checked={n.feito}
                  aria-label={n.feito ? 'Desmarcar' : 'Marcar'}
                  className={[
                    // Alvo de toque confortável (28px) com a caixinha de 24px dentro.
                    'shrink-0 -my-0.5 p-0.5 flex items-center justify-center rounded-md',
                    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A85A]/60',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors',
                      n.feito
                        // Marcada: preenchida em latão, check escuro pra contraste óbvio.
                        ? 'bg-[#D4A85A] border-[#D4A85A] text-[#0B0A08]'
                        // Desmarcada: borda bem visível sobre o fundo escuro.
                        : 'border-[#8B8FA8] bg-transparent hover:border-[#D4A85A]',
                    ].join(' ')}
                  >
                    {n.feito && (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </button>

                {editId === n.id ? (
                  <input
                    value={editTexto}
                    onChange={e => setEditTexto(e.target.value)}
                    onBlur={() => salvarEdicao(n.id)}
                    onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(n.id); if (e.key === 'Escape') setEditId(null) }}
                    autoFocus
                    maxLength={500}
                    className="input flex-1 text-sm py-1"
                  />
                ) : (
                  <span
                    onClick={() => { setEditId(n.id); setEditTexto(n.texto) }}
                    className={[
                      'flex-1 text-sm font-sans cursor-text leading-snug',
                      n.feito ? 'text-text-muted line-through' : 'text-text',
                    ].join(' ')}
                  >
                    {n.texto}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remover(n.id)}
                  aria-label="Remover"
                  className="text-text-muted hover:text-red-400 transition-colors shrink-0 p-1"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
