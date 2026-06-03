'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Copy,
  Check,
  QrCode,
  MessageCircle,
  Gift,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { chanceEfetiva } from '@/lib/feedbackCliente'
import {
  ativarFeedbackCliente,
  desativarFeedbackCliente,
  salvarMensagemPosFeedback,
  criarBrinde,
  atualizarBrinde,
  excluirBrinde,
  salvarValidadeBrinde,
} from './feedbackClienteActions'

export interface BrindeUI {
  id: string
  nome: string
  descricao: string | null
  peso: number
  ativo: boolean
}

interface Props {
  ativo: boolean
  slug: string | null
  mensagem: string
  brindes: BrindeUI[]
  origem: string // ex: "https://bussola.app"
  validadeInicial?: number // dias — 15/30/60/90
}

const VALIDADES: { v: 15 | 30 | 60 | 90; label: string; rec?: boolean }[] = [
  { v: 15, label: '15 dias' },
  { v: 30, label: '30 dias', rec: true },
  { v: 60, label: '60 dias' },
  { v: 90, label: '90 dias' },
]

const MENSAGEM_PADRAO = 'Obrigado pelo seu feedback! Sua opinião nos ajuda a melhorar.'

export default function FeedbackClienteSection({ ativo, slug, mensagem, brindes, origem, validadeInicial = 30 }: Props) {
  const [validade, setValidade] = useState<number>(validadeInicial)
  const [validadeMsg, setValidadeMsg] = useState<string | null>(null)

  const [feedbackUI, setFeedbackUI] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Toggle on/off.
  function alternarAtivo(novo: boolean) {
    setFeedbackUI(null)
    startTransition(async () => {
      const res = novo ? await ativarFeedbackCliente() : await desativarFeedbackCliente()
      setFeedbackUI(res?.error ?? (novo ? 'Ativado' : 'Desativado'))
    })
  }

  function alterarValidade(dias: number) {
    setValidade(dias)
    setValidadeMsg(null)
    startTransition(async () => {
      const r = await salvarValidadeBrinde(dias)
      setValidadeMsg(r?.error ?? 'Validade salva')
    })
  }

  const linkPublico = slug ? `${origem}/c/${slug}` : null
  const textoWhats = linkPublico
    ? `Oi! Aqui está o link pra você avaliar seu atendimento. Leva 30 segundos: ${linkPublico}`
    : ''
  const whatsHref = linkPublico
    ? `https://wa.me/?text=${encodeURIComponent(textoWhats)}`
    : '#'

  const [copiado, setCopiado] = useState(false)
  async function copiarLink() {
    if (!linkPublico) return
    try { await navigator.clipboard.writeText(linkPublico) } catch { /* ignore */ }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Mensagem pós feedback.
  const [msg, setMsg] = useState(mensagem || MENSAGEM_PADRAO)
  const [msgSalva, setMsgSalva] = useState<string | null>(null)
  function salvarMsg() {
    setMsgSalva(null)
    startTransition(async () => {
      const res = await salvarMensagemPosFeedback(msg)
      setMsgSalva(res?.error ?? 'Mensagem salva')
    })
  }

  // Brindes.
  const [lista, setLista] = useState<BrindeUI[]>(brindes)
  const chances = useMemo(() => chanceEfetiva(lista.filter((b) => b.ativo)), [lista])

  function patch(id: string, parcial: Partial<BrindeUI>) {
    setLista((prev) => prev.map((b) => (b.id === id ? { ...b, ...parcial } : b)))
  }

  function salvarBrinde(b: BrindeUI) {
    startTransition(async () => {
      const res = await atualizarBrinde(b.id, { nome: b.nome, descricao: b.descricao, peso: b.peso, ativo: b.ativo })
      if (res?.error) setFeedbackUI(res.error)
    })
  }

  function removerBrinde(id: string) {
    startTransition(async () => {
      const res = await excluirBrinde(id)
      if (res?.error) {
        setFeedbackUI(res.error)
        return
      }
      setLista((prev) => prev.filter((b) => b.id !== id))
    })
  }

  function adicionarBrinde() {
    startTransition(async () => {
      const res = await criarBrinde({ nome: 'Novo brinde', descricao: null, peso: 10, ativo: true })
      if (!res || 'error' in res) {
        setFeedbackUI(res?.error ?? 'Erro ao criar brinde.')
        return
      }
      const novo: BrindeUI = { id: res.id, nome: 'Novo brinde', descricao: null, peso: 10, ativo: true }
      setLista((prev) => [...prev, novo])
    })
  }

  const semBrindesAtivos = lista.filter((b) => b.ativo).length === 0

  return (
    <div className="card p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <Gift size={20} strokeWidth={1.5} color="#8B6F47" /> Feedback de Cliente
        </h2>
        <p className="text-sm text-chumbo mt-1">
          Colete avaliações dos clientes após o atendimento. Quem deixa comentário concorre a um brinde do seu pool.
        </p>
      </div>

      {/* TOGGLE PRINCIPAL */}
      <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border">
        <span className="text-sm text-text">
          Ativar coleta de feedback de cliente
          <span className="block text-xs text-chumbo">Gera um link público pra você compartilhar com seus clientes.</span>
        </span>
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => alternarAtivo(e.target.checked)}
          disabled={isPending}
          className="accent-marrom w-5 h-5 shrink-0"
        />
      </label>

      {ativo && linkPublico && (
        <>
          {/* LINK PÚBLICO */}
          <div className="space-y-2">
            <label className="label">Link público pra clientes</label>
            <input value={linkPublico} readOnly onFocus={(e) => e.currentTarget.select()} className="input text-sm" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copiarLink} className="btn-secondary text-sm">
                {copiado ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
                {copiado ? 'Copiado' : 'Copiar link'}
              </button>
              <a href="/api/feedback-cliente/qr" className="btn-secondary text-sm" target="_blank" rel="noopener noreferrer">
                <QrCode size={16} strokeWidth={1.5} /> Baixar QR Code
              </a>
              <a href={whatsHref} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                <MessageCircle size={16} strokeWidth={1.5} /> Compartilhar no WhatsApp
              </a>
            </div>
          </div>

          {/* MENSAGEM PÓS-FEEDBACK */}
          <div className="space-y-2">
            <label className="label">Mensagem que o cliente vê após enviar</label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value.slice(0, 200))}
              rows={3}
              className="input text-sm"
              placeholder={MENSAGEM_PADRAO}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-chumbo">{msg.length}/200</span>
              <button type="button" onClick={salvarMsg} disabled={isPending} className="btn-secondary text-sm">
                Salvar mensagem
              </button>
            </div>
            {msgSalva && <p className="text-xs text-chumbo">{msgSalva}</p>}
          </div>

          {/* VALIDADE DO BRINDE */}
          <div className="space-y-2">
            <label className="label">Validade do brinde</label>
            <p className="text-xs text-chumbo">
              Tempo que o cliente tem pra usar o brinde após receber. Aplica apenas a brindes novos —
              sorteados anteriormente mantêm a validade original.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {VALIDADES.map((o) => {
                const on = validade === o.v
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => alterarValidade(o.v)}
                    disabled={isPending}
                    className={`rounded-md border p-2.5 text-sm transition-colors ${
                      on ? 'border-marrom bg-linho/40 text-marrom font-medium' : 'border-border text-grafite hover:bg-linho/30'
                    }`}
                  >
                    {o.label}
                    {o.rec && <span className="block text-[10px] text-chumbo font-normal">(recomendado)</span>}
                  </button>
                )
              })}
            </div>
            {validadeMsg && <p className="text-xs text-chumbo">{validadeMsg}</p>}
          </div>

          {/* BRINDES */}
          <div className="space-y-3">
            <label className="label">Brindes (pool de sorteio)</label>

            {semBrindesAtivos && (
              <div className="rounded-md border-l-[3px] border-ambar bg-ambar/5 p-3 text-sm text-grafite inline-flex items-start gap-2">
                <AlertTriangle size={16} strokeWidth={1.5} className="text-ambar shrink-0 mt-0.5" />
                <span>
                  Cadastre pelo menos 1 brinde ativo pra ativar o sorteio. Sem brindes, clientes que comentarem verão apenas a mensagem de agradecimento.
                </span>
              </div>
            )}

            {lista.map((b) => {
              const chance = chances.get(b.id)
              return (
                <div key={b.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={b.nome}
                      onChange={(e) => patch(b.id, { nome: e.target.value })}
                      onBlur={() => salvarBrinde(b)}
                      placeholder="Nome do brinde"
                      className="input text-sm flex-1"
                    />
                    <label className="inline-flex items-center gap-1 text-xs text-grafite shrink-0">
                      <input
                        type="checkbox"
                        checked={b.ativo}
                        onChange={(e) => {
                          patch(b.id, { ativo: e.target.checked })
                          salvarBrinde({ ...b, ativo: e.target.checked })
                        }}
                        className="accent-marrom w-4 h-4"
                      />
                      Ativo
                    </label>
                    <button type="button" onClick={() => removerBrinde(b.id)} className="text-chumbo hover:text-vinho p-1" aria-label="Excluir brinde">
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={b.descricao ?? ''}
                    onChange={(e) => patch(b.id, { descricao: e.target.value })}
                    onBlur={() => salvarBrinde(b)}
                    placeholder="Descrição (opcional)"
                    className="input text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={b.peso}
                      onChange={(e) => patch(b.id, { peso: Number(e.target.value) })}
                      onMouseUp={() => salvarBrinde(b)}
                      onTouchEnd={() => salvarBrinde(b)}
                      className="flex-1 accent-marrom"
                    />
                    <span className="text-xs text-chumbo whitespace-nowrap">peso {b.peso}</span>
                    {b.ativo && chance !== undefined && (
                      <span className="text-xs font-semibold text-marrom whitespace-nowrap">
                        {Math.round(chance * 100)}% de chance
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <button type="button" onClick={adicionarBrinde} disabled={isPending} className="btn-secondary w-full text-sm">
              <Plus size={16} strokeWidth={1.5} /> Adicionar brinde
            </button>
          </div>
        </>
      )}

      {feedbackUI && <p className="text-xs text-chumbo">{feedbackUI}</p>}
    </div>
  )
}
