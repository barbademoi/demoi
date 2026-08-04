'use client'

import { useState, useTransition } from 'react'
import { solicitarAcessoBrindoleta } from './actions'

interface Props {
  pixKey: string
  pixReceiver: string
  pixQrImageUrl: string
  pixPaymentUrl: string
  priceLabel: string
  pending: boolean
}

export default function BrindoletaCheckout({
  pixKey,
  pixReceiver,
  pixQrImageUrl,
  pixPaymentUrl,
  priceLabel,
  pending: pendingInicial,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(pendingInicial)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

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
      const result = await solicitarAcessoBrindoleta(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setPending(true)
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
              Recebemos seu aviso. O acesso será liberado depois que o pagamento de {priceLabel} for confirmado pelo responsável.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pagamento único</p>
        <div className="mt-2 flex items-end gap-2">
          <strong className="font-serif text-4xl text-text">{priceLabel}</strong>
          <span className="pb-1 text-sm text-text-muted">sem mensalidade</span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {!pixKey && !pixPaymentUrl ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-200">
            O pagamento está temporariamente indisponível. Fale com o suporte.
          </div>
        ) : (
          <>
            {pixPaymentUrl && (
              <a
                href={pixPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-center"
              >
                Pagar {priceLabel} com Pix ↗
              </a>
            )}
            {pixQrImageUrl && (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                {/* Imagem fornecida pelo banco/recebedor; não contém dados gerados pelo navegador. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pixQrImageUrl} alt="QR Code para pagar a Brindoleta via Pix" className="h-44 w-44" />
              </div>
            )}
            {pixKey && <div>
              <label className="label" htmlFor="brindoleta-pix-key">Chave Pix aleatória</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="brindoleta-pix-key"
                  readOnly
                  value={pixKey}
                  className="input min-w-0 flex-1 font-mono text-[16px]"
                  style={{ fontSize: '16px' }}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button type="button" onClick={copyPixKey} className="btn-primary shrink-0 px-5">
                  {copied ? 'Chave copiada ✓' : 'Copiar chave Pix'}
                </button>
              </div>
              {pixReceiver && (
                <p className="mt-2 text-xs text-text-muted">
                  Confira no banco: <span className="font-semibold text-text">{pixReceiver}</span> · valor {priceLabel}
                </p>
              )}
            </div>}
          </>
        )}

        <div className="h-px bg-border" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="payer_name" className="label">Nome de quem fez o Pix *</label>
            <input
              id="payer_name"
              name="payer_name"
              required
              minLength={3}
              maxLength={120}
              autoComplete="name"
              placeholder="Nome que aparece no comprovante"
              className="input text-[16px]"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <label htmlFor="payment_note" className="label">Observação (opcional)</label>
            <input
              id="payment_note"
              name="payment_note"
              maxLength={240}
              placeholder="Ex.: Pix feito pelo sócio João"
              className="input text-[16px]"
              style={{ fontSize: '16px' }}
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={isSubmitting || (!pixKey && !pixPaymentUrl)} className="btn-primary w-full py-3.5">
            {isSubmitting ? 'Enviando para conferência…' : 'Já fiz o pagamento'}
          </button>
          <p className="text-center text-xs leading-relaxed text-text-muted">
            Este botão não libera o acesso sozinho. O responsável confirma o Pix antes da ativação.
          </p>
        </form>
      </div>
    </div>
  )
}
