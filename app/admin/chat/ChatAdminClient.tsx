'use client'

import { useEffect, useState, useTransition } from 'react'
import { MARCADORES } from '@/lib/chat/marcadores'
import {
  publicarComunicado, despublicarComunicado, preverComunicado,
  responderSuporte, marcarConversaLida, carregarConversa,
  salvarAvisoResposta, type MensagemAdmin,
} from './actions'

export type ComunicadoAdmin = {
  id: string; corpo: string; publicadoEm: string; ativo: boolean
}

export type ConversaResumo = {
  usuarioId: string
  email: string
  barbearia: string
  assinaturaOk: boolean
  estado: string | null
  validoAte: string | null
  ultimaMensagem: string
  ultimaEm: string
  ultimoAutor: 'cliente' | 'admin'
  naoLidas: number
  total: number
}

export type OpcaoBarbearia = { id: string; nome: string }

function quando(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

type Aba = 'comunicado' | 'suporte' | 'config'

export default function ChatAdminClient({
  comunicados, conversas, barbearias, avisoInicial,
}: {
  comunicados: ComunicadoAdmin[]
  conversas: ConversaResumo[]
  barbearias: OpcaoBarbearia[]
  avisoInicial: string
}) {
  const esperando = conversas.reduce((n, c) => n + (c.naoLidas > 0 ? 1 : 0), 0)
  const [aba, setAba] = useState<Aba>(esperando > 0 ? 'suporte' : 'comunicado')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, startTransition] = useTransition()

  // ── Comunicado ──────────────────────────────────────────────────────────
  const [texto, setTexto] = useState('')
  const [previaBarbearia, setPreviaBarbearia] = useState(barbearias[0]?.id ?? '')
  const [previa, setPrevia] = useState<string>('')
  const [semDado, setSemDado] = useState<string[]>([])

  // Prévia com dados REAIS: escrever no escuro e descobrir a frase quebrada
  // depois de publicar pra 600 pessoas não é aceitável.
  useEffect(() => {
    if (aba !== 'comunicado' || texto.trim().length === 0) { setPrevia(''); setSemDado([]); return }
    const t = setTimeout(() => {
      preverComunicado(texto, previaBarbearia || null)
        .then((r) => { setPrevia(r.texto ?? ''); setSemDado(r.semDado ?? []) })
        .catch(() => {})
    }, 350)
    return () => clearTimeout(t)
  }, [texto, previaBarbearia, aba])

  function inserir(chave: string) {
    setTexto((t) => `${t}{${chave}}`)
  }

  function publicar() {
    if (!texto.trim() || pendente) return
    if (!confirm('Publicar este comunicado para TODOS os assinantes ativos?')) return
    setErro(null)
    startTransition(async () => {
      const r = await publicarComunicado(texto)
      if (r.error) setErro(r.error)
      else { setTexto(''); setPrevia('') }
    })
  }

  // ── Suporte ─────────────────────────────────────────────────────────────
  const [aberta, setAberta] = useState<ConversaResumo | null>(null)
  const [mensagens, setMensagens] = useState<MensagemAdmin[]>([])
  const [resposta, setResposta] = useState('')

  function abrir(c: ConversaResumo) {
    setAberta(c); setMensagens([]); setResposta(''); setErro(null)
    carregarConversa(c.usuarioId).then((r) => {
      if (r.error) setErro(r.error)
      else setMensagens(r.mensagens ?? [])
    })
    if (c.naoLidas > 0) marcarConversaLida(c.usuarioId).catch(() => {})
  }

  function responder() {
    if (!aberta || !resposta.trim() || pendente) return
    setErro(null)
    const alvo = aberta.usuarioId
    startTransition(async () => {
      const r = await responderSuporte(alvo, resposta)
      if (r.error) { setErro(r.error); return }
      setResposta('')
      const rec = await carregarConversa(alvo)
      setMensagens(rec.mensagens ?? [])
    })
  }

  // ── Config ──────────────────────────────────────────────────────────────
  const [aviso, setAviso] = useState(avisoInicial)
  const [salvo, setSalvo] = useState(false)

  function salvarAviso() {
    setErro(null); setSalvo(false)
    startTransition(async () => {
      const r = await salvarAvisoResposta(aviso)
      if (r.error) setErro(r.error)
      else setSalvo(true)
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {([
          ['comunicado', 'Mensagem do dia', 0],
          ['suporte', 'Suporte', esperando],
          ['config', 'Tempo de resposta', 0],
        ] as const).map(([id, rotulo, badge]) => (
          <button key={id} type="button" onClick={() => setAba(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              aba === id ? 'border-primary/60 bg-primary/10 text-text' : 'border-border text-text-muted hover:text-text'
            }`}>
            {rotulo}
            {badge > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {erro && <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-3 text-sm text-red-200">{erro}</div>}

      {aba === 'comunicado' && (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-text">Escreva a mensagem</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Uma mensagem só, que todos os assinantes ativos veem — cada um com os próprios números.
            </p>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 4000))}
              rows={5}
              placeholder="Bom dia, {nome_barbearia}! Faltam {falta_pra_meta} pra bater a meta e ainda temos {dias_para_fechar}."
              className="input mt-3 w-full resize-y text-[16px]"
              style={{ fontSize: '16px' }}
            />

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Marcadores disponíveis</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MARCADORES.map((m) => (
                <button key={m.chave} type="button" onClick={() => inserir(m.chave)}
                  title={m.descricao}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted transition hover:border-primary/50 hover:text-text">
                  {'{'}{m.chave}{'}'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
              Sem dado, o marcador vira um texto neutro. Pra controlar como a frase termina,
              escreva a alternativa depois da barra: <code className="text-text">{'{falta_pra_meta|ainda dá tempo}'}</code>.
            </p>
          </div>

          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text">Prévia com dados reais</p>
              <select value={previaBarbearia} onChange={(e) => setPreviaBarbearia(e.target.value)}
                className="input max-w-[16rem] text-sm">
                {barbearias.length === 0 && <option value="">Nenhum assinante ativo</option>}
                {barbearias.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-surface-2/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {previa || <span className="text-text-muted">A prévia aparece conforme você escreve.</span>}
              </p>
            </div>
            {semDado.length > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-amber-300">
                Sem dado nesta barbearia: {semDado.map(s => `{${s}}`).join(', ')} — caiu no texto neutro.
                Outras barbearias podem ter o número.
              </p>
            )}
            <button type="button" onClick={publicar} disabled={pendente || !texto.trim()}
              className="btn-primary mt-4 text-sm disabled:opacity-50">
              {pendente ? 'Publicando…' : 'Publicar para todos'}
            </button>
          </div>

          <div className="card divide-y divide-border overflow-hidden">
            <p className="p-4 text-sm font-semibold text-text">Histórico</p>
            {comunicados.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">Nenhum comunicado publicado ainda.</p>
            ) : comunicados.map((c) => (
              <div key={c.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-[16rem] flex-1">
                  <p className="text-[11px] text-text-muted">
                    {quando(c.publicadoEm)}
                    {!c.ativo && <span className="ml-2 text-red-300">fora do ar</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text">{c.corpo}</p>
                </div>
                {c.ativo && (
                  <button type="button" disabled={pendente}
                    onClick={() => startTransition(async () => {
                      const r = await despublicarComunicado(c.id)
                      if (r.error) setErro(r.error)
                    })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text disabled:opacity-50">
                    Tirar do ar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'suporte' && (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="card divide-y divide-border overflow-hidden">
            {conversas.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">Nenhuma conversa ainda.</p>
            ) : conversas.map((c) => (
              <button key={c.usuarioId} type="button" onClick={() => abrir(c)}
                className={`block w-full p-4 text-left transition hover:bg-white/5 ${
                  aberta?.usuarioId === c.usuarioId ? 'bg-white/5' : ''
                }`}>
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{c.barbearia}</p>
                  {c.naoLidas > 0 && (
                    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {c.naoLidas}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-text-muted">{c.email}</p>
                <p className="mt-1 truncate text-xs text-text-muted">
                  {c.ultimoAutor === 'admin' ? 'Você: ' : ''}{c.ultimaMensagem}
                </p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {quando(c.ultimaEm)}
                  {!c.assinaturaOk && <span className="ml-2 text-red-300">assinatura inativa</span>}
                </p>
              </button>
            ))}
          </div>

          <div className="card p-5">
            {!aberta ? (
              <p className="py-8 text-center text-sm text-text-muted">Escolha uma conversa à esquerda.</p>
            ) : (
              <>
                {/* Contexto do cliente: responder sem saber com quem se fala
                    gera resposta genérica, que é o que o chat quer evitar. */}
                <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                  <p className="text-sm font-semibold text-text">{aberta.barbearia}</p>
                  <p className="text-xs text-text-muted">{aberta.email}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {aberta.assinaturaOk ? 'Assinatura ativa' : 'Assinatura inativa'}
                    {aberta.estado && ` · ${aberta.estado}`}
                    {aberta.validoAte && ` · vale até ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(aberta.validoAte))}`}
                    {` · ${aberta.total} mensagens`}
                  </p>
                </div>

                <div className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto">
                  {mensagens.length === 0 ? (
                    <p className="py-6 text-center text-sm text-text-muted">Carregando…</p>
                  ) : mensagens.map((m) => {
                    const meu = m.autor === 'admin'
                    return (
                      <div key={m.id} className={`flex ${meu ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          meu ? 'bg-primary/15 text-text' : 'border border-border bg-surface-2 text-text'
                        }`}>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.corpo}</p>
                          <p className="mt-1.5 text-[10px] text-text-muted">{quando(m.criadoEm)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value.slice(0, 4000))}
                  rows={3}
                  placeholder="Escreva a resposta…"
                  className="input mt-4 w-full resize-y text-[16px]"
                  style={{ fontSize: '16px' }}
                />
                <button type="button" onClick={responder} disabled={pendente || !resposta.trim()}
                  className="btn-primary mt-2 text-sm disabled:opacity-50">
                  {pendente ? 'Enviando…' : 'Responder'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {aba === 'config' && (
        <div className="card max-w-xl p-5">
          <p className="text-sm font-semibold text-text">Aviso de tempo de resposta</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Aparece no topo do suporte, pro assinante. É o combinado escrito — sem ele,
            qualquer demora vira reclamação.
          </p>
          <textarea
            value={aviso}
            onChange={(e) => { setAviso(e.target.value.slice(0, 240)); setSalvo(false) }}
            rows={2}
            className="input mt-3 w-full resize-y text-[16px]"
            style={{ fontSize: '16px' }}
          />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={salvarAviso} disabled={pendente || aviso.trim().length < 3}
              className="btn-primary text-sm disabled:opacity-50">
              {pendente ? 'Salvando…' : 'Salvar'}
            </button>
            {salvo && <span className="text-xs text-emerald-300">Salvo.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
