'use client'

import { useState, useTransition } from 'react'
import { solicitarAcessoTarefix } from './actions'

interface Props {
  pixKey: string
  pixReceiver: string
  pixQrImageUrl: string
  pixPaymentUrl: string
  priceLabel: string
  pending: boolean
  empresaNome: string
  ownerEmail: string
}

export default function TarefixCheckout({ pixKey, pixReceiver, pixQrImageUrl, pixPaymentUrl, priceLabel, pending: pendingInicial, empresaNome, ownerEmail }: Props) {
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(pendingInicial)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()
  const semPix = !pixKey && !pixPaymentUrl

  async function copyPixKey() {
    if (!pixKey) return
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione a chave acima.')
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await solicitarAcessoTarefix(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.status === 'active') window.location.reload()
      else setPending(true)
    })
  }

  if (pending) {
    return (
      <div className="rounded-2xl border border-amber-400/35 bg-amber-400/[0.08] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-lg">⏳</span>
          <div>
            <h3 className="font-sans font-semibold text-text">Pagamento em conferência</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              Recebemos seu aviso. Assim que o Pix de {priceLabel} for confirmado, o Tarefix é liberado aqui mesmo nesta página, com o botão para abrir.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const campo = 'input text-[16px]'
  return (
    <form onSubmit={handleSubmit} className="card overflow-hidden">
      <div className="border-b border-border p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pagamento único</p>
        <div className="mt-2 flex items-end gap-2">
          <strong className="font-serif text-4xl text-text">{priceLabel}</strong>
          <span className="pb-1 text-sm text-text-muted">sem mensalidade</span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">1. Seus dados</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="nome_barbearia" className="label">Nome da barbearia</label>
              <input id="nome_barbearia" name="nome_barbearia" required minLength={2} maxLength={80} defaultValue={empresaNome} className={campo} style={{ fontSize: '16px' }} />
            </div>
            <div>
              <label htmlFor="whatsapp" className="label">Número do WhatsApp</label>
              <input id="whatsapp" name="whatsapp" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder="(11) 91234-5678" className={campo} style={{ fontSize: '16px' }} />
              <p className="mt-1 text-xs text-text-muted">Usamos para avisar quando o acesso for liberado.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">2. Faça o Pix de {priceLabel}</p>
          {semPix ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-200">O pagamento está temporariamente indisponível. Fale com o suporte.</div>
          ) : (
            <div className="space-y-4">
              {pixPaymentUrl && (
                <a href={pixPaymentUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-center">
                  Pagar {priceLabel} com Pix ↗
                </a>
              )}
              {pixQrImageUrl && (
                <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pixQrImageUrl} alt="QR Code para pagar o Tarefix via Pix" className="h-44 w-44" />
                </div>
              )}
              {pixKey && (
                <div>
                  <label className="label" htmlFor="tarefix-pix-key">Chave Pix aleatória</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input id="tarefix-pix-key" readOnly value={pixKey} className="input min-w-0 flex-1 font-mono text-[16px]" style={{ fontSize: '16px' }} onFocus={(e) => e.currentTarget.select()} />
                    <button type="button" onClick={copyPixKey} className="btn-primary shrink-0 px-5">
                      {copied ? 'Chave copiada ✓' : 'Copiar chave Pix'}
                    </button>
                  </div>
                  {pixReceiver && (
                    <p className="mt-2 text-xs text-text-muted">
                      Confira no banco: <span className="font-semibold text-text">{pixReceiver}</span> · valor {priceLabel}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">3. Avise que pagou</p>
          {ownerEmail && <p className="text-sm text-text-muted">O Tarefix será liberado na conta <span className="font-semibold text-text">{ownerEmail}</span>.</p>}
          <button type="submit" disabled={isSubmitting || semPix} className="btn-primary w-full py-3.5">
            {isSubmitting ? 'Enviando para conferência…' : `Já fiz o Pix de ${priceLabel} — enviar para aprovação`}
          </button>
          <details className="group">
            <summary className="cursor-pointer list-none text-center text-xs text-text-muted underline decoration-dotted underline-offset-4">O Pix foi feito por outra pessoa? Informe o nome</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="payer_name" className="label">Nome de quem fez o Pix</label>
                <input id="payer_name" name="payer_name" maxLength={120} autoComplete="name" className={campo} style={{ fontSize: '16px' }} />
              </div>
              <div>
                <label htmlFor="payment_note" className="label">Observação (opcional)</label>
                <input id="payment_note" name="payment_note" maxLength={240} placeholder="Ex.: Pix feito pelo sócio João" className={campo} style={{ fontSize: '16px' }} />
              </div>
            </div>
          </details>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <p className="text-center text-xs leading-relaxed text-text-muted">Este botão não libera o acesso sozinho. O responsável confirma o Pix antes da ativação.</p>
        </div>
      </div>
    </form>
  )
}
