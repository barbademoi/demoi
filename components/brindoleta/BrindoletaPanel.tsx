'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createBrindoletaExamples,
  decideBrindoletaSale,
  deleteBrindoletaOffer,
  deleteBrindoletaSale,
  saveBrindoletaOffer,
  updateBrindoletaSale,
} from '@/app/dashboard/brindoleta/panel-actions'
import type {
  BrindoletaBarber,
  BrindoletaOffer,
  BrindoletaOfferType,
  BrindoletaSale,
  BrindoletaSpin,
} from '@/lib/brindoleta/types'

type Tab = 'campaign' | 'qr' | 'results' | 'guide'

type OfferDraft = {
  id?: string
  title: string
  benefit: string
  offerType: BrindoletaOfferType
  chance: number
  stock: number
  revenueReais: string
  color: string
  enabled: boolean
}

const EMPTY_OFFER: OfferDraft = {
  title: '',
  benefit: '',
  offerType: 'Serviço',
  chance: 15,
  stock: 20,
  revenueReais: '0,00',
  color: '#d8ff00',
  enabled: true,
}

const tabs: Array<{ id: Tab; label: string; short: string }> = [
  { id: 'campaign', label: 'Campanha', short: 'Ofertas' },
  { id: 'qr', label: 'Equipe & QR', short: 'QR Codes' },
  { id: 'results', label: 'Resultados', short: 'Vendas' },
  { id: 'guide', label: 'Tutorial', short: 'Ajuda' },
]

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

function reaisToCents(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  return Math.max(0, Math.round((Number(normalized) || 0) * 100))
}

function offerToDraft(offer: BrindoletaOffer): OfferDraft {
  return {
    id: offer.id,
    title: offer.title,
    benefit: offer.benefit,
    offerType: offer.offer_type,
    chance: offer.chance,
    stock: offer.stock,
    revenueReais: (offer.revenue_cents / 100).toFixed(2).replace('.', ','),
    color: offer.color,
    enabled: offer.enabled,
  }
}

interface Props {
  businessName: string
  publicBaseUrl: string
  offers: BrindoletaOffer[]
  barbers: BrindoletaBarber[]
  spins: BrindoletaSpin[]
  sales: BrindoletaSale[]
}

export default function BrindoletaPanel({ businessName, publicBaseUrl, offers, barbers, spins, sales }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('campaign')
  const [draft, setDraft] = useState<OfferDraft | null>(null)
  const [editingSale, setEditingSale] = useState<BrindoletaSale | null>(null)
  const [editCustomer, setEditCustomer] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeOffers = offers.filter((offer) => offer.enabled && offer.stock > 0)
  const chanceTotal = activeOffers.reduce((sum, offer) => sum + offer.chance, 0)
  const confirmed = sales.filter((sale) => sale.status === 'confirmed')
  const pendingSales = sales.filter((sale) => sale.status === 'pending')
  const revenue = confirmed.reduce((sum, sale) => sum + sale.amount_cents, 0)
  const barberById = useMemo(() => new Map(barbers.map((barber) => [barber.id, barber])), [barbers])
  const barberStats = useMemo(() => barbers.map((barber) => {
    const barberSpins = spins.filter((spin) => spin.barbeiro_id === barber.id).length
    const barberSales = sales.filter((sale) => sale.barbeiro_id === barber.id)
    const barberConfirmed = barberSales.filter((sale) => sale.status === 'confirmed')
    return {
      ...barber,
      spins: barberSpins,
      accepted: barberSales.length,
      confirmed: barberConfirmed.length,
      revenue: barberConfirmed.reduce((sum, sale) => sum + sale.amount_cents, 0),
      conversion: barberSpins > 0 ? Math.round((barberSales.length / barberSpins) * 100) : 0,
    }
  }).sort((a, b) => b.revenue - a.revenue || b.confirmed - a.confirmed), [barbers, sales, spins])

  function run(action: () => Promise<{ ok?: boolean; error?: string }>, success: string) {
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage(success)
      setDraft(null)
      setEditingSale(null)
      router.refresh()
    })
  }

  function submitOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    run(() => saveBrindoletaOffer({
      id: draft.id,
      title: draft.title,
      benefit: draft.benefit,
      offerType: draft.offerType,
      chance: draft.chance,
      stock: draft.stock,
      revenueCents: reaisToCents(draft.revenueReais),
      color: draft.color,
      enabled: draft.enabled,
    }), draft.id ? 'Oferta atualizada.' : 'Oferta cadastrada.')
  }

  function toggleOffer(offer: BrindoletaOffer) {
    run(() => saveBrindoletaOffer({
      ...offerToDraft(offer),
      revenueCents: offer.revenue_cents,
      enabled: !offer.enabled,
    }), offer.enabled ? 'Oferta desativada.' : 'Oferta ativada.')
  }

  function copy(text: string, success: string) {
    navigator.clipboard.writeText(text).then(() => {
      setError('')
      setMessage(success)
    }).catch(() => setError('Não foi possível copiar automaticamente.'))
  }

  function startSaleEdit(sale: BrindoletaSale) {
    setEditingSale(sale)
    setEditCustomer(sale.customer_name)
    setEditAmount((sale.amount_cents / 100).toFixed(2).replace('.', ','))
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 font-black text-emerald-300">✓</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">Acesso ativo</p>
            <p className="text-sm text-text-muted">Configure tudo aqui dentro, sem código e sem outro login.</p>
          </div>
        </div>
        <Link href="/configuracoes" className="btn-ghost border border-border text-xs">Configurar empresa e equipe</Link>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-border bg-surface p-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-2 py-3 text-center text-[11px] font-bold transition-colors sm:text-sm ${tab === item.id ? 'bg-[#d8ff00] text-[#11110f]' : 'text-text-muted hover:bg-surface-2 hover:text-text'}`}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </button>
        ))}
      </div>

      {(message || error) && (
        <div className={`mb-5 rounded-xl border p-3 text-sm ${error ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>
          {error || message}
        </div>
      )}

      {tab === 'campaign' && (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Campanha</p>
                <h2 className="mt-1 font-serif text-2xl text-text">Ofertas na roleta</h2>
                <p className="mt-1 text-sm text-text-muted">Até 6 itens ativos. As chances funcionam como o peso de cada oferta.</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-text">{activeOffers.length}/6 ativas</span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${chanceTotal === 100 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>{chanceTotal}% distribuído</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setDraft({ ...EMPTY_OFFER })} className="rounded-xl bg-[#d8ff00] px-4 py-3 text-sm font-black text-[#11110f]">＋ Nova oferta</button>
              {offers.length === 0 && (
                <button type="button" disabled={isPending} onClick={() => run(createBrindoletaExamples, 'Seis ofertas de exemplo foram criadas.')} className="btn-ghost border border-border text-sm">
                  Criar campanha de exemplo
                </button>
              )}
            </div>
          </section>

          {draft && (
            <form onSubmit={submitOffer} className="card border-[#d8ff00]/30 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl text-text">{draft.id ? 'Editar oferta' : 'Nova oferta'}</h3>
                <button type="button" onClick={() => setDraft(null)} className="text-sm text-text-muted hover:text-text">Cancelar</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="offer-title">Nome curto na roleta</label>
                  <input id="offer-title" required maxLength={50} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="input text-base sm:text-sm" placeholder="Ex.: 20% OFF LIMPEZA DE PELE" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="offer-benefit">Descrição exibida depois do giro</label>
                  <input id="offer-benefit" required maxLength={140} value={draft.benefit} onChange={(event) => setDraft({ ...draft, benefit: event.target.value })} className="input text-base sm:text-sm" placeholder="Ex.: R$ 10,00 de desconto hoje" />
                </div>
                <div>
                  <label className="label" htmlFor="offer-type">Tipo</label>
                  <select id="offer-type" value={draft.offerType} onChange={(event) => setDraft({ ...draft, offerType: event.target.value as BrindoletaOfferType })} className="input text-base sm:text-sm">
                    <option>Serviço</option><option>Produto</option><option>Brinde</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="offer-color">Cor da fatia</label>
                  <div className="flex gap-2">
                    <input id="offer-color" type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="h-12 w-16 rounded-xl border border-border bg-surface-2 p-1" />
                    <input value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="input text-base sm:text-sm" aria-label="Cor hexadecimal" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="offer-chance">Chance/peso</label>
                  <input id="offer-chance" type="number" min="1" max="100" value={draft.chance} onChange={(event) => setDraft({ ...draft, chance: Number(event.target.value) })} className="input text-base sm:text-sm" />
                </div>
                <div>
                  <label className="label" htmlFor="offer-stock">Estoque</label>
                  <input id="offer-stock" type="number" min="0" max="99999" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} className="input text-base sm:text-sm" />
                </div>
                <div>
                  <label className="label" htmlFor="offer-revenue">Valor estimado da venda</label>
                  <input id="offer-revenue" inputMode="decimal" value={draft.revenueReais} onChange={(event) => setDraft({ ...draft, revenueReais: event.target.value })} className="input text-base sm:text-sm" placeholder="0,00" />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">
                  <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} className="h-5 w-5 accent-[#d8ff00]" />
                  Exibir na roleta
                </label>
              </div>
              <button disabled={isPending} className="mt-5 w-full rounded-xl bg-[#d8ff00] px-5 py-3 font-black text-[#11110f] disabled:opacity-50">
                {isPending ? 'Salvando…' : 'Salvar oferta'}
              </button>
            </form>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((offer) => (
              <article key={offer.id} className={`card overflow-hidden ${offer.enabled ? '' : 'opacity-65'}`}>
                <div className="h-2" style={{ background: offer.color }} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-text-muted">{offer.offer_type}</span>
                      <h3 className="mt-1 text-base font-bold text-text">{offer.title}</h3>
                      <p className="mt-1 text-sm text-text-muted">{offer.benefit}</p>
                    </div>
                    <button type="button" role="switch" aria-checked={offer.enabled} onClick={() => toggleOffer(offer)} disabled={isPending} className={`relative h-7 w-12 shrink-0 rounded-full ${offer.enabled ? 'bg-[#d8ff00]' : 'bg-surface-2'}`}>
                      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${offer.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-surface-2 p-2"><span className="block text-text-muted">Chance</span><strong className="text-text">{offer.chance}%</strong></div>
                    <div className="rounded-lg bg-surface-2 p-2"><span className="block text-text-muted">Estoque</span><strong className="text-text">{offer.stock}</strong></div>
                    <div className="rounded-lg bg-surface-2 p-2"><span className="block text-text-muted">Venda</span><strong className="text-text">{money(offer.revenue_cents)}</strong></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setDraft(offerToDraft(offer))} className="btn-ghost flex-1 border border-border text-xs">Editar</button>
                    <button type="button" onClick={() => window.confirm('Excluir esta oferta?') && run(() => deleteBrindoletaOffer(offer.id), 'Oferta excluída.')} className="btn-ghost border border-red-400/25 text-xs text-red-200">Excluir</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Equipe & QR</p>
            <h2 className="mt-1 font-serif text-2xl text-text">Um QR Code por profissional</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">Mostre o código no celular ou imprima em 10 × 10 cm para colocar na bancada ou no espelho. Cada link identifica quem originou a venda.</p>
            <Link href="/configuracoes" className="mt-4 inline-flex btn-ghost border border-border text-sm">Cadastrar ou editar colaboradores</Link>
          </section>

          {barbers.length === 0 ? (
            <div className="card p-8 text-center text-sm text-text-muted">Cadastre pelo menos um barbeiro nas configurações do BarberMeta.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {barbers.map((barber) => {
                const url = `${publicBaseUrl}/brindoleta/${barber.link_codigo}`
                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(url)}`
                return (
                  <article key={barber.id} className="card p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      {barber.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={barber.foto_url} alt={barber.nome} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8ff00] font-black text-[#11110f]">{barber.nome.slice(0, 2).toUpperCase()}</span>
                      )}
                      <div>
                        <h3 className="font-bold text-text">{barber.nome}</h3>
                        <p className="text-xs text-text-muted">QR individual ativo</p>
                      </div>
                    </div>
                    <div className="mx-auto my-4 w-fit rounded-xl bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} alt={`QR Code da Brindoleta de ${barber.nome}`} className="h-36 w-36" />
                    </div>
                    <p className="truncate rounded-lg bg-surface-2 p-2 text-[10px] text-text-muted">{url}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => copy(url, `Link de ${barber.nome} copiado.`)} className="btn-ghost border border-border text-xs">Copiar link</button>
                      <Link href={`/dashboard/brindoleta/qr/${barber.id}`} target="_blank" className="rounded-xl bg-[#d8ff00] px-3 py-2.5 text-center text-xs font-black text-[#11110f]">Imprimir / PDF</Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Giros" value={String(spins.length)} />
            <Metric label="Ofertas aceitas" value={String(sales.length)} />
            <Metric label="Pendentes" value={String(pendingSales.length)} highlight />
            <Metric label="Vendas confirmadas" value={money(revenue)} />
          </div>

          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Desempenho da equipe</p>
                <h2 className="mt-1 font-serif text-2xl text-text">Resultado por colaborador</h2>
              </div>
              <p className="text-xs text-text-muted">Somente vendas confirmadas entram no valor.</p>
            </div>
            {barberStats.length === 0 ? (
              <p className="mt-5 text-sm text-text-muted">Cadastre colaboradores para acompanhar o desempenho individual.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {barberStats.map((barber) => (
                  <div key={barber.id} className="rounded-xl border border-border bg-surface-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {barber.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barber.foto_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8ff00] text-xs font-black text-[#11110f]">{barber.nome.slice(0, 2).toUpperCase()}</span>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-text">{barber.nome}</h3>
                          <p className="text-xs text-text-muted">{barber.confirmed} venda{barber.confirmed === 1 ? '' : 's'} confirmada{barber.confirmed === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <strong className="shrink-0 text-sm text-[#d8ff00]">{money(barber.revenue)}</strong>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Giros</span><strong className="text-text">{barber.spins}</strong></div>
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Aceites</span><strong className="text-text">{barber.accepted}</strong></div>
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Conversão</span><strong className="text-text">{barber.conversion}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Resultados</p>
            <h2 className="mt-1 font-serif text-2xl text-text">Confirmação das vendas</h2>
            <p className="mt-2 text-sm text-text-muted">Confirme somente depois que o serviço ou produto realmente for vendido.</p>
          </section>

          {sales.length === 0 ? (
            <div className="card p-8 text-center text-sm text-text-muted">As ofertas aceitas pelos clientes aparecerão aqui.</div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => {
                const barber = barberById.get(sale.barbeiro_id)
                const statusStyle = sale.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-300' : sale.status === 'rejected' ? 'bg-red-400/10 text-red-200' : 'bg-amber-400/10 text-amber-200'
                const statusLabel = sale.status === 'confirmed' ? 'Confirmada' : sale.status === 'rejected' ? 'Não realizada' : 'Aguardando confirmação'
                return (
                  <article key={sale.id} className="card p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-text">{sale.customer_name}</h3>
                        <p className="mt-1 text-sm text-text-muted">{sale.offer_title} · {sale.benefit}</p>
                        <p className="mt-1 text-xs text-text-muted">{barber?.nome ?? 'Colaborador'} · {dateTime(sale.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <strong className="block text-text">{money(sale.amount_cents)}</strong>
                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>{statusLabel}</span>
                      </div>
                    </div>

                    {editingSale?.id === sale.id ? (
                      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-surface-2 p-3 sm:grid-cols-[1fr_150px_auto]">
                        <input value={editCustomer} onChange={(event) => setEditCustomer(event.target.value)} className="input bg-surface text-base sm:text-sm" aria-label="Nome do cliente" />
                        <input value={editAmount} onChange={(event) => setEditAmount(event.target.value)} className="input bg-surface text-base sm:text-sm" inputMode="decimal" aria-label="Valor da venda" />
                        <button type="button" onClick={() => run(() => updateBrindoletaSale({ id: sale.id, customerName: editCustomer, amountCents: reaisToCents(editAmount) }), 'Venda editada.')} className="rounded-xl bg-[#d8ff00] px-4 py-2 text-xs font-black text-[#11110f]">Salvar</button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {sale.status === 'pending' && (
                          <>
                            <button type="button" onClick={() => window.confirm('A venda foi realmente realizada?') && run(() => decideBrindoletaSale(sale.id, 'confirmed'), 'Venda confirmada e contabilizada.')} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-emerald-950">Confirmar venda</button>
                            <button type="button" onClick={() => window.confirm('Marcar como não realizada?') && run(() => decideBrindoletaSale(sale.id, 'rejected'), 'Venda marcada como não realizada.')} className="btn-ghost border border-border text-xs">Não realizada</button>
                          </>
                        )}
                        <button type="button" onClick={() => startSaleEdit(sale)} className="btn-ghost border border-border text-xs">Editar</button>
                        <button type="button" onClick={() => window.confirm('Excluir definitivamente este registro?') && run(() => deleteBrindoletaSale(sale.id), 'Venda excluída.')} className="btn-ghost border border-red-400/25 text-xs text-red-200">Excluir</button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'guide' && <Guide businessName={businessName} />}
    </div>
  )
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? 'border-[#d8ff00]/30' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <strong className={`mt-2 block text-2xl ${highlight ? 'text-[#d8ff00]' : 'text-text'}`}>{value}</strong>
    </div>
  )
}

function Guide({ businessName }: { businessName: string }) {
  const topics = [
    ['1. Prepare as ofertas', 'Cadastre até 6 benefícios. Use nomes curtos, descrições claras, estoque e um valor estimado de venda.'],
    ['2. Gere os QR Codes', 'Abra Equipe & QR, confira cada profissional e imprima o cartão em 10 × 10 cm.'],
    ['3. Posicione no atendimento', 'Deixe o QR na bancada ou no espelho, sem reflexo e ao alcance da câmera do cliente.'],
    ['4. Oriente o cliente', 'Explique que ele ganhou um giro. A descrição completa aparece somente depois que a roleta parar.'],
    ['5. Converta a oferta', 'Se o cliente aceitar, ele informa apenas o nome. A solicitação entra como venda pendente.'],
    ['6. Confirme diariamente', 'Em Resultados, confirme somente as vendas realizadas. Edite ou exclua registros quando necessário.'],
  ]
  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Tutorial da Brindoleta</p>
        <h2 className="mt-1 font-serif text-2xl text-text">Do cadastro à primeira venda</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">Passo a passo para a equipe da {businessName} usar a roleta com segurança e consistência.</p>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        {topics.map(([title, description]) => (
          <article key={title} className="card p-5">
            <h3 className="font-bold text-text">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-[#d8ff00]/25 bg-[#d8ff00]/[0.06] p-5 text-sm leading-relaxed text-text-muted">
        <strong className="text-[#d8ff00]">Dica de venda:</strong> em vez de perguntar apenas “você quer?”, mostre o ganho: “Com esse benefício, você pode incluir este serviço hoje por apenas…”.
      </div>
    </div>
  )
}
