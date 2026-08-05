'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
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

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function segmentTextSize(title: string) {
  if (title.length > 30) return 'text-[8px] sm:text-[10px]'
  if (title.length > 22) return 'text-[9px] sm:text-[11px]'
  if (title.length > 15) return 'text-[10px] sm:text-[13px]'
  return 'text-[11px] sm:text-[15px]'
}

function iconFor(type: string) {
  if (type === 'Produto') return '🧴'
  if (type === 'Brinde') return '🎁'
  return '✂️'
}

// Chuva de confete — pura (CSS), sem libs. Só monta no momento da vitória.
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 48 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      dur: 2.2 + Math.random() * 1.7,
      color: ['#d8ff00', '#ff6045', '#ffd149', '#35b7eb', '#9365ed', '#f44696'][i % 6],
      w: 6 + Math.random() * 7,
      rot: Math.random() * 360,
    })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', left: `${p.left}%`, top: '-8%',
            width: p.w, height: p.w * 0.62, background: p.color, borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `bmfall ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.3,1) forwards`,
          }}
        />
      ))}
      <style>{'@keyframes bmfall{0%{opacity:0;transform:translateY(0) rotate(0deg)}8%{opacity:1}100%{opacity:0;transform:translateY(114vh) rotate(600deg)}}'}</style>
    </div>
  )
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
  const [stage, setStage] = useState<Stage>('ready')
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<BrindoletaPrize | null>(null)
  const [spinId, setSpinId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [error, setError] = useState('')
  const [resumed, setResumed] = useState(false)
  const [isClaiming, startClaim] = useTransition()
  const spinLocked = useRef(false)
  const claimLocked = useRef(false)
  const revealTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current)
  }, [])

  const wheelBackground = useMemo(() => {
    if (offers.length === 0) return '#24261f'
    const slice = 360 / offers.length
    const stops = offers.flatMap((offer, index) => [
      `${offer.color} ${index * slice}deg`,
      `${offer.color} ${(index + 1) * slice}deg`,
    ])
    const separators = `repeating-conic-gradient(from ${-slice / 2}deg, rgba(13,15,12,.78) 0deg 1.25deg, transparent 1.25deg ${slice}deg)`
    return `${separators}, conic-gradient(from ${-slice / 2}deg, ${stops.join(', ')})`
  }, [offers])

  async function handleSpin() {
    if (offers.length < 2 || stage !== 'ready' || spinLocked.current) return
    spinLocked.current = true
    setError('')
    setStage('loading')

    try {
      const result = await spinBrindoleta({ codigo })
      if ('error' in result) {
        setError(result.error)
        setStage(result.code === 'already_spun' ? 'blocked' : 'ready')
        spinLocked.current = result.code === 'already_spun'
        return
      }

      setOffers(result.offers)
      setPrize(result.prize)
      setSpinId(result.spinId)
      setResumed(!!result.resumed)
      const selectedIndex = Math.max(0, result.offers.findIndex((offer) => offer.id === result.prize.id))
      const slice = 360 / Math.max(result.offers.length, 1)
      setStage('spinning')
      window.requestAnimationFrame(() => setRotation(6 * 360 - selectedIndex * slice))
      revealTimer.current = window.setTimeout(() => setStage('prize'), 6100)
    } catch {
      setError('A conexão falhou antes do giro. Verifique sua internet e tente novamente.')
      setStage('ready')
      spinLocked.current = false
    }
  }

  function handleAccept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!prize || !spinId || claimLocked.current) return
    claimLocked.current = true
    setError('')

    startClaim(async () => {
      try {
        const result = await acceptBrindoletaPrize({ codigo, spinId, customerName })
        if ('error' in result) {
          setError(result.error)
          claimLocked.current = false
          return
        }
        setStage('success')
      } catch {
        setError('A conexão caiu antes da confirmação. Tente novamente; seu prêmio continua reservado neste aparelho.')
        claimLocked.current = false
      }
    })
  }

  const canSpin = offers.length >= 2 && stage === 'ready'
  const centerTitle = stage === 'loading' ? 'AGUARDE' : stage === 'spinning' ? 'BOA SORTE' : 'GIRAR'
  const centerSubtitle = stage === 'loading' ? 'preparando' : stage === 'spinning' ? 'girando' : 'a roleta'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d0f0c] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 50% 8%, rgba(216,255,0,.13), transparent 28%), radial-gradient(circle at 88% 72%, rgba(53,183,235,.07), transparent 30%), linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)', backgroundSize: 'auto, auto, 40px 40px, 40px 40px' }} />
        <div className="absolute -left-28 top-1/3 h-64 w-64 rounded-full bg-[#d8ff00]/[0.035] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-8 pt-4 sm:px-7 sm:pt-6">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-2.5 pr-3 shadow-[0_14px_35px_rgba(0,0,0,.18)] backdrop-blur-md sm:p-3 sm:pr-4">
          <div className="flex min-w-0 items-center gap-3">
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt={`Logo da ${businessName}`} className="h-11 w-11 rounded-xl border border-white/15 bg-white object-cover shadow-sm sm:h-12 sm:w-12" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8ff00] font-black text-[#11130f] shadow-[0_0_20px_rgba(216,255,0,.16)] sm:h-12 sm:w-12">{initials(businessName)}</span>
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-black tracking-[0.02em] sm:text-base">{businessName}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff00] shadow-[0_0_7px_#d8ff00]" />
                <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-white/45">Brindoleta ativa</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 py-1.5 pl-1.5 pr-2.5 sm:pr-3">
            {barberPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barberPhoto} alt={`Foto de ${barberName}`} className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[10px] font-black sm:h-9 sm:w-9">{initials(barberName)}</span>
            )}
            <span className="max-w-[92px] truncate text-left text-[10px] leading-tight text-white/45 sm:max-w-[135px] sm:text-xs">Atendimento com<br /><strong className="text-white">{barberName}</strong></span>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-6 text-center sm:py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8ff00]/20 bg-[#d8ff00]/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.23em] text-[#d8ff00]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff00] shadow-[0_0_7px_#d8ff00]" />
            Benefício exclusivo
          </div>
          <h1 className="mt-4 max-w-lg font-serif text-[clamp(2.35rem,10vw,4rem)] leading-[0.95] tracking-[-0.025em]">
            Seu próximo benefício está a <em className="text-[#d8ff00]">um giro</em> de distância.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50 sm:text-base">Gire e descubra uma condição preparada especialmente para este atendimento.</p>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d8ff00] text-xs font-black text-[#11130f]">1×</span>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">Giro liberado hoje</p>
              <p className="mt-0.5 text-[9px] text-white/30">Toque no centro para começar</p>
            </div>
          </div>

          <div className="relative mt-5 aspect-square w-full max-w-[470px] rounded-[38px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-black/10 p-[3.2%] shadow-[0_30px_80px_rgba(0,0,0,.34)]">
            <div className="pointer-events-none absolute left-1/2 top-[0.5%] z-30 -translate-x-1/2" aria-hidden>
              <div className="relative flex h-12 w-12 items-start justify-center rounded-full border-[5px] border-[#0d0f0c] bg-[#d8ff00] shadow-[0_7px_22px_rgba(216,255,0,.24)]">
                <span className="mt-7 h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#d8ff00]" />
              </div>
            </div>

            <div className="absolute inset-[4.5%] rounded-full bg-gradient-to-br from-[#f8f5eb] via-[#c8c5bb] to-[#f8f5eb] p-[2.6%] shadow-[0_0_0_5px_#252822,0_18px_48px_rgba(0,0,0,.55)]">
              <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-black/35 bg-[#22251f]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: wheelBackground,
                    transform: `rotate(${rotation}deg)`,
                    transition: stage === 'spinning' ? 'transform 6s cubic-bezier(.08,.64,.08,1)' : 'none',
                    willChange: 'transform',
                  }}
                >
                  <div className="absolute inset-[6.5%] rounded-full border border-black/30 shadow-[inset_0_0_22px_rgba(0,0,0,.12)]" />
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_36%_28%,rgba(255,255,255,.2),transparent_26%,rgba(0,0,0,.06)_70%)]" />
                  {offers.map((offer, index) => {
                    const angle = index * (360 / offers.length)
                    return (
                      <div key={offer.id} className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                        <div className={`absolute left-1/2 top-[8.5%] flex min-h-[17%] w-[30%] -translate-x-1/2 flex-col items-center justify-start gap-1 text-center ${segmentTextSize(offer.title)}`}>
                          <span className="text-[15px] leading-none sm:text-[19px]" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.55))' }}>{iconFor(offer.offer_type)}</span>
                          <span className="max-w-full break-words font-black uppercase leading-[1.04] tracking-[-0.02em] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,.95), 0 0 3px rgba(0,0,0,.7), 0 0 1px rgba(0,0,0,1)' }}>{offer.title}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pointer-events-none absolute inset-[34.5%] z-10 rounded-full bg-gradient-to-br from-[#f8f5eb] to-[#bdbab0] p-[3.5%] shadow-[0_6px_22px_rgba(0,0,0,.42)]" aria-hidden>
                  <div className="h-full w-full rounded-full bg-[#0f110e]" />
                </div>
              </div>
            </div>

            {canSpin && (
              <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[27%] w-[27%] min-h-[88px] min-w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ animation: 'bmpulse 1.9s ease-out infinite' }} />
            )}
            <style>{'@keyframes bmpulse{0%{box-shadow:0 0 0 0 rgba(216,255,0,.5)}70%{box-shadow:0 0 0 24px rgba(216,255,0,0)}100%{box-shadow:0 0 0 0 rgba(216,255,0,0)}}'}</style>

            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="group absolute left-1/2 top-1/2 z-20 flex h-[27%] w-[27%] min-h-[88px] min-w-[88px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#10120f] text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,.035),0_7px_20px_rgba(0,0,0,.38)] transition duration-200 enabled:hover:scale-[1.025] enabled:hover:border-[#d8ff00]/45 enabled:active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-90"
              aria-label="Girar a roleta"
            >
              <span className="absolute inset-x-4 top-2 h-1/3 rounded-full bg-white/[0.035] blur-sm" />
              {stage === 'loading' && <span className="mb-1 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#d8ff00]" />}
              <span className={`${stage === 'spinning' ? 'text-[clamp(11px,3.2vw,16px)]' : 'text-[clamp(15px,5vw,29px)]'} relative font-black leading-none tracking-[-0.04em]`}>{centerTitle}</span>
              <span className="relative mt-1 text-[7px] font-black uppercase tracking-[0.2em] text-[#d8ff00] sm:text-[9px]">{centerSubtitle}</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
            <span className="flex items-center gap-1.5"><span className="text-[#d8ff00]">✓</span> Resultado seguro</span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <span>Válido neste atendimento</span>
          </div>

          <div className="w-full max-w-md" aria-live="polite" role="status">
            {offers.length < 2 && (
              <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100">As ofertas estão sendo preparadas. Tente novamente em breve.</p>
            )}
            {error && stage !== 'blocked' && (
              <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/[0.08] px-4 py-3 text-sm text-red-100">{error}</p>
            )}
            {stage === 'blocked' && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-relaxed text-white/60">
                <strong className="block text-white">Giro de hoje concluído</strong>
                <span>{error || 'Volte amanhã para uma nova chance.'}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {(stage === 'prize' || stage === 'success') && <Confetti />}

      {(stage === 'prize' || stage === 'claim' || stage === 'success') && prize && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center" role="dialog" aria-modal="true" aria-labelledby="prize-title">
          <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/15 bg-[#151713] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, transparent, ${prize.color}, transparent)` }} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-20" style={{ background: `radial-gradient(circle at 50% 0%, ${prize.color}, transparent 68%)` }} />

            <div className="relative p-6 text-center sm:p-8">
              {stage === 'success' ? (
                <>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d8ff00] text-3xl font-black text-[#11130f] shadow-[0_12px_30px_rgba(216,255,0,.18)]">✓</span>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">Oferta reservada</p>
                  <h2 id="prize-title" className="mt-2 font-serif text-3xl leading-tight">Mostre esta tela ao profissional</h2>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Seu benefício</p>
                    <p className="mt-1 font-bold text-white">{prize.title}</p>
                    <p className="mt-1 text-sm text-white/55">{prize.benefit}</p>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-white/40">O estabelecimento confirmará a venda no painel do BarberMeta.</p>
                </>
              ) : stage === 'claim' ? (
                <form onSubmit={handleAccept}>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ff00]/20 bg-[#d8ff00]/10 text-xl">✦</span>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">Só falta confirmar</p>
                  <h2 id="prize-title" className="mt-2 font-serif text-3xl">Como podemos chamar você?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">Seu nome será usado apenas para identificar esta oferta no atendimento.</p>
                  <label htmlFor="customer-name" className="sr-only">Seu nome</label>
                  <input id="customer-name" autoFocus required minLength={2} maxLength={80} autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-5 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#d8ff00]/70 focus:ring-4 focus:ring-[#d8ff00]/10" placeholder="Digite seu nome" />
                  {error && <p className="mt-3 rounded-xl bg-red-300/10 p-3 text-sm text-red-200">{error}</p>}
                  <button type="submit" disabled={isClaiming} className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#d8ff00] px-4 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#11130f] shadow-[0_12px_30px_rgba(216,255,0,.14)] transition hover:brightness-105 active:scale-[.99] disabled:cursor-wait disabled:opacity-60">
                    {isClaiming ? 'Reservando…' : 'Confirmar e reservar'}
                  </button>
                  <button type="button" onClick={() => { claimLocked.current = false; setError(''); setStage('prize') }} className="mt-3 min-h-[44px] px-4 text-xs font-bold text-white/40 transition hover:text-white/70">Voltar ao prêmio</button>
                </form>
              ) : (
                <>
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl shadow-lg">✦</span>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ff00]">{resumed ? 'Resultado recuperado' : 'Você desbloqueou'}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"><span className="text-sm">{iconFor(prize.offer_type)}</span>{prize.offer_type}</span>
                  <h2 id="prize-title" className="mt-3 font-serif text-[clamp(2.25rem,9vw,3.25rem)] leading-[0.95] tracking-[-0.02em]" style={{ textShadow: `0 0 28px ${prize.color}55` }}>{prize.title}</h2>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Condição liberada</p>
                    <p className="mt-1 text-base font-bold leading-relaxed text-white/85">{prize.benefit}</p>
                  </div>
                  <button type="button" onClick={() => { setError(''); setStage('claim') }} className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-[#d8ff00] px-4 py-4 text-sm font-black uppercase tracking-[0.055em] text-[#11130f] shadow-[0_12px_30px_rgba(216,255,0,.15)] transition hover:brightness-105 active:scale-[.99]">Quero aproveitar agora</button>
                  <button type="button" onClick={() => { setError(''); setStage('blocked') }} className="mt-3 min-h-[44px] px-4 text-xs font-bold text-white/35 transition hover:text-white/65">Agora não</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
