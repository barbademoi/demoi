'use client'

import { useState } from 'react'
import { Erro } from '@/components/tarefix/ui'
import { enviarPedido } from './acoes'

type Props = { pixKey: string; pixReceiver: string; pixQrImageUrl: string; pixPaymentUrl: string }

export function FormCompra({ pixKey, pixReceiver, pixQrImageUrl, pixPaymentUrl }: Props) {
  const [d, setD] = useState({ nome: '', email: '', whatsapp: '', empresa: '', payer: '', site: '' })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const semPix = !pixKey && !pixPaymentUrl

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      setErro('Não consegui copiar. Selecione a chave e copie.')
    }
  }

  if (pronto) {
    return (
      <div className="tf-cartao p-6 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h3 className="mt-3 text-2xl font-black">Pedido recebido!</h3>
        <p className="mt-2 text-tf-suave">
          Assim que o Pix for conferido, você recebe no <b>WhatsApp {d.whatsapp}</b> o link, o e-mail e a senha para entrar no Tarefix.
        </p>
      </div>
    )
  }

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value })
  const passo = 'mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-tf-marca-texto'
  return (
    <form
      className="tf-cartao space-y-6 p-5 sm:p-7"
      onSubmit={async (e) => {
        e.preventDefault()
        setErro(null)
        setEnviando(true)
        try {
          const r = await enviarPedido(d)
          if (r.ok) setPronto(true)
          else setErro(r.erro)
        } catch {
          setErro('Sem conexão. Tente de novo.')
        }
        setEnviando(false)
      }}
    >
      <div>
        <p className={passo}>1. Seus dados</p>
        <div className="space-y-3">
          <div>
            <label className="tf-rotulo" htmlFor="v-nome">Seu nome</label>
            <input id="v-nome" className="tf-campo" required maxLength={80} autoComplete="name" value={d.nome} onChange={set('nome')} />
          </div>
          <div>
            <label className="tf-rotulo" htmlFor="v-empresa">Nome da empresa ou negócio</label>
            <input id="v-empresa" className="tf-campo" required maxLength={80} value={d.empresa} onChange={set('empresa')} placeholder="Ex.: Studio Bella, Clínica Sorriso…" />
          </div>
          <div>
            <label className="tf-rotulo" htmlFor="v-zap">WhatsApp (com DDD)</label>
            <input id="v-zap" className="tf-campo" required inputMode="tel" autoComplete="tel" maxLength={20} value={d.whatsapp} onChange={set('whatsapp')} placeholder="(11) 91234-5678" />
          </div>
          <div>
            <label className="tf-rotulo" htmlFor="v-email">E-mail (vai ser o seu login)</label>
            <input id="v-email" className="tf-campo" required type="email" autoComplete="email" maxLength={160} value={d.email} onChange={set('email')} />
          </div>
          {/* campo-isca para robôs */}
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={d.site} onChange={set('site')} />
        </div>
      </div>

      <div>
        <p className={passo}>2. Faça o Pix de R$ 47,00</p>
        {semPix ? (
          <p className="rounded-xl bg-tf-marca-clara p-4 text-sm">O pagamento está temporariamente indisponível. Chame no WhatsApp.</p>
        ) : (
          <div className="space-y-3">
            {pixPaymentUrl && (
              <a href={pixPaymentUrl} target="_blank" rel="noopener noreferrer" className="tf-botao w-full">
                Pagar R$ 47,00 com Pix ↗
              </a>
            )}
            {pixQrImageUrl && (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pixQrImageUrl} alt="QR Code do Pix" className="h-44 w-44" />
              </div>
            )}
            {pixKey && (
              <div>
                <label className="tf-rotulo" htmlFor="v-pix">Ou copie a chave Pix</label>
                <div className="flex gap-2">
                  <input id="v-pix" readOnly value={pixKey} className="tf-campo min-w-0 flex-1 font-mono" onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" onClick={copiar} className="tf-botao2 shrink-0">
                    {copiado ? 'Copiada ✓' : 'Copiar'}
                  </button>
                </div>
                {pixReceiver && <p className="mt-1 text-sm text-tf-suave">Confira no banco: <b>{pixReceiver}</b> · R$ 47,00</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <p className={passo}>3. Avise que pagou</p>
        <details className="mb-3">
          <summary className="cursor-pointer text-sm text-tf-suave underline decoration-dotted">O Pix foi feito em outro nome? Informe aqui</summary>
          <input className="tf-campo mt-2" maxLength={120} value={d.payer} onChange={set('payer')} placeholder="Nome de quem fez o Pix" />
        </details>
        <Erro texto={erro} />
        <button type="submit" disabled={enviando || semPix} className="tf-botao mt-2 w-full text-base">
          {enviando ? 'Enviando…' : 'Já fiz o Pix: quero meu acesso'}
        </button>
        <p className="mt-2 text-center text-xs text-tf-suave">O acesso é liberado assim que o Pix for conferido, e chega no seu WhatsApp.</p>
      </div>
    </form>
  )
}
