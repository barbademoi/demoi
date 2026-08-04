'use client'

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react'
import { acceptBrindoletaPrize, spinBrindoleta } from './actions'
import type { BrindoletaPrize, PublicBrindoletaOffer } from '@/lib/brindoleta/types'

type Props = {
  codigo: string
  businessName: string
  businessLogo: string | null
  barberName: string
  barberPhoto: string | null
  initialOffers: PublicBrindoletaOffer[]
}

type Stage = 'ready' | 'loading' | 'spinning' | 'prize' | 'claim' | 'success' | 'blocked'

const TOKEN_KEY = 'brindoleta_client_token_v1'

function createToken() {
  return `${crypto.randomUUID().replace(/-/g, '')}_${crypto.randomUUID().replace(/-/g, '')}`
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function BrindoletaWheel({
  codigo,
  businessName,
  businessLogo,
  barberName,
  barberPhoto,
  initialOffers,
}: Props) {
  const [offers, setOffers] = useState(initialOffers)
  const [clientToken, setClientToken] = useState('')
  const [stage, setStage] = useState<Stage>('ready')
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<BrindoletaPrize | null>(null)
  const [spinId, setSpinId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [error, setError] = useState('')
  const [isClaiming, startClaim] = useTransition()

  useEffect(() => {
    let token = window.localStorage.getItem(TOKEN_KEY) ?? ''
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(token)) {
      token = createToken()
      window.localStorage.setItem(TOKEN_KEY, token)
    }
    setClientToken(token)
  }, [])

  const wheelBackground = useMemo(() => {
    if (offers.length === 0) return '#24261f'
    const slice = 360 / offers.length
    const stops = offers.flatMap((offer, index) => [
      `${offer.color} ${index * slice}deg`,
      `${offer.color} ${(index + 1) * slice}deg`,
    ])
    return `conic-gradient(from ${-slice / 2}deg, ${stops.join(', ')})`
  }, [offers])

  async function handleSpin() {
    if (!clientToken || offers.length < 2 || stage !== 'ready') return
    setError('')
    setStage('loading')
    const result = await spinBrindoleta({ codigo, clientToken })
    if ('error' in result) {
      setError(result.error)
      setStage(result.code === 'already_spun' ? 'blocked' : 'ready')
      return
    }

    setOffers(result.offers)
    setPrize(result.prize)
    setSpinId(result.spinId)
    const selectedIndex = Math.max(0, result.offers.findIndex((offer) => offer.id === result.prize.id))
    const slice = 360 / result.offers.length
    setStage('spinning')
    requestAnimationFrame(() => setRotation(6 * 360 - selectedIndex * slice))
    window.setTimeout(() => setStage('prize'), 6100)
  }

  function handleAccept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!prize || !spinId) return
    setError('')
    startClaim(async () => {
      const result = await acceptBrindoletaPrize({ codigo, clientToken, spinId, customerName })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setStage('success')
    })
  }

  const canSpin = offers.length >= 2 && !!clientToken && stage === 'ready'

  return (
    <main className="min-h-screen overflow-hidden bg-[#11130f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 50% 18%, rgba(216,255,0,.11), transparent 30%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: 'auto, 42px 42px, 42px 42px' }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-5 sm:px-7">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt="" className="h-11 w-11 rounded-full border border-white/20 bg-white object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8ff00]/60 bg-[#d8ff00] font-black text-[#11130f]">{initials(businessName)}</span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.12em]">{businessName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Brindoleta</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3">
            {barberPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barberPhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-black">{initials(barberName)}</span>
            )}
            <span className="max-w-[110px] truncate text-xs text-white/65">com <strong className="text-white">{barberName}</strong></span>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-7 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8ff00]">Benefício exclusivo</p>
          <h1 className="mt-3 max-w-md font-serif text-4xl leading-[0.98] sm:text-5xl">
            Seu próximo benefício está a <em className="text-[#d8ff00]">um giro</em> de distância.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">Gire e desbloqueie uma condição especial para aproveitar ainda hoje.</p>

          <div className="mt-7 flex items-center gap-2 rounded-full border border-[#d8ff00]/25 bg-[#d8ff00]/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d8ff00] text-[#11130f]">1</span>
            giro liberado
          </div>

          <div className="relative mt-5 aspect-square w-full max-w-[470px]">
            <div className="absolute left-1/2 top-[-2px] z-30 -translate-x-1/2">
              <div className="h-0 w-0 border-l-[20px] border-r-[20px] border-t-[44px] border-l-transparent border-r-transparent border-t-[#d8ff00] drop-shadow-[0_4px_0_#11130f]" />
            </div>
            <div className="absolute inset-[1.5%] rounded-full border-[10px] border-[#eceade] bg-[#eceade] shadow-[0_0_0_6px_#24261f,0_18px_50px_rgba(0,0,0,.55)]">
              <div
                className="absolute inset-0 overflow-hidden rounded-full border-2 border-black/30"
                style={{
                  background: wheelBackground,
                  transform: `rotate(${rotation}deg)`,
                  transition: stage === 'spinning' ? 'transform 6s cubic-bezier(.1,.68,.08,1)' : 'none',
                }}
              >
                <div className="absolute inset-[8%] rounded-full border-2 border-black/25" />
                {offers.map((offer, index) => {
                  const angle = index * (360 / offers.length)
                  const size = offer.title.length > 25 ? 'text-[8px] sm:text-[10px]' : offer.title.length > 16 ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-sm'
                  return (
                    <div key={offer.id} className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                      <div className={`absolute left-1/2 top-[13%] w-[27%] -translate-x-1/2 text-center font-black uppercase leading-[1.02] text-black ${size}`}>
                        {offer.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="absolute left-1/2 top-1/2 z-20 flex h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[6px] border-[#eceade] bg-[#11130f] shadow-[0_5px_18px_rgba(0,0,0,.45)] disabled:cursor-not-allowed"
              aria-label="Girar a roleta"
            >
              <span className="text-[clamp(18px,6vw,34px)] font-black leading-none">{stage === 'loading' ? '…' : 'GIRAR'}</span>
              <span className="mt-1 text-[7px] font-black uppercase tracking-[0.2em] text-[#d8ff00] sm:text-[9px]">a roleta</span>
            </button>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Oferta pessoal e válida para este atendimento.</p>
          {offers.length < 2 && <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">As ofertas estão sendo preparadas. Tente novamente em breve.</p>}
          {error && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</p>}
        </section>
      </div>

      {(stage === 'prize' || stage === 'claim' || stage === 'success') && prize && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="prize-title">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#171914] shadow-2xl">
            <div className="h-2" style={{ background: prize.color }} />
            <div className="p-6 text-center sm:p-8">
              {stage === 'success' ? (
                <>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d8ff00] text-3xl font-black text-[#11130f]">✓</span>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">Oferta reservada</p>
                  <h2 id="prize-title" className="mt-2 font-serif text-3xl">Mostre esta tela ao profissional</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">O estabelecimento confirmará a venda no painel do BarberMeta.</p>
                </>
              ) : stage === 'claim' ? (
                <form onSubmit={handleAccept}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">Só falta confirmar</p>
                  <h2 id="prize-title" className="mt-2 font-serif text-3xl">Como podemos chamar você?</h2>
                  <p className="mt-2 text-sm text-white/55">Seu nome será usado apenas para identificar esta oferta no atendimento.</p>
                  <label htmlFor="customer-name" className="sr-only">Seu nome</label>
                  <input id="customer-name" autoFocus required maxLength={80} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-5 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-base text-white outline-none focus:border-[#d8ff00]" placeholder="Digite seu nome" />
                  {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
                  <button type="submit" disabled={isClaiming} className="mt-4 w-full rounded-xl bg-[#d8ff00] px-4 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#11130f] disabled:opacity-60">{isClaiming ? 'Reservando…' : 'Confirmar oferta'}</button>
                </form>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">Você desbloqueou</p>
                  <span className="mt-5 inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{prize.offer_type}</span>
                  <h2 id="prize-title" className="mt-3 font-serif text-4xl leading-none">{prize.title}</h2>
                  <p className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-base font-bold leading-relaxed text-white/80">{prize.benefit}</p>
                  <button type="button" onClick={() => { setError(''); setStage('claim') }} className="mt-5 w-full rounded-xl bg-[#d8ff00] px-4 py-4 text-sm font-black uppercase tracking-[0.06em] text-[#11130f]">Quero aproveitar agora</button>
                  <button type="button" onClick={() => setStage('blocked')} className="mt-3 text-xs text-white/35">Agora não</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {stage === 'blocked' && !error && (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-white/10 bg-[#1b1e17] p-4 text-center text-sm text-white/65 shadow-2xl">
          Seu giro de hoje foi concluído. Volte amanhã para uma nova chance!
        </div>
      )}
    </main>
  )
}
