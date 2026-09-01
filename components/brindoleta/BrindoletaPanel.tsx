'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BrindoletaQr from '@/components/brindoleta/BrindoletaQr'
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
import { totaisDoCiclo, desempenhoPorBarbeiro, listaParaConferencia } from '@/lib/brindoleta/periodo'

type Tab = 'campaign' | 'qr' | 'results' | 'guide'

type OfferDraft = {
  id?: string
  title: string
  benefit: string
  offerType: BrindoletaOfferType
  chance: number
  stock: number
  color: string
  enabled: boolean
}

const EMPTY_OFFER: OfferDraft = {
  title: '',
  benefit: '',
  offerType: 'Serviço',
  chance: 15,
  stock: 20,
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
    color: offer.color,
    enabled: offer.enabled,
  }
}

interface Props {
  businessName: string
  publicBaseUrl: string
  offers: BrindoletaOffer[]
  /** Giros e vendas JÁ CORTADOS pelo ciclo exibido — o corte é feito no servidor. */
  barbers: BrindoletaBarber[]
  spins: BrindoletaSpin[]
  sales: BrindoletaSale[]
  /** Pendentes de TODO o período: fila de trabalho, não placar do mês. */
  pendentesTotais: BrindoletaSale[]
  cicloLabel: string
  ehCicloAtual: boolean
  navegacaoCicloSlot: ReactNode
}

export default function BrindoletaPanel({
  businessName, publicBaseUrl, offers, barbers, spins, sales,
  pendentesTotais, cicloLabel, ehCicloAtual, navegacaoCicloSlot,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('campaign')
  const [draft, setDraft] = useState<OfferDraft | null>(null)
  const [editingSale, setEditingSale] = useState<BrindoletaSale | null>(null)
  const [editCustomer, setEditCustomer] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [confirmingSale, setConfirmingSale] = useState<BrindoletaSale | null>(null)
  const [confirmAmount, setConfirmAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeOffers = offers.filter((offer) => offer.enabled && offer.stock > 0)
  const chanceTotal = activeOffers.reduce((sum, offer) => sum + offer.chance, 0)

  // `spins` e `sales` chegam já cortados pelo ciclo — o servidor não manda o
  // que é de outro mês. Os totais são calculados pela mesma função da régua
  // compartilhada, e não por reduces soltos aqui.
  const totais = useMemo(() => totaisDoCiclo(spins, sales), [spins, sales])

  // A lista de conferência é o ciclo MAIS as pendentes de qualquer outro:
  // uma venda de agosto que ninguém decidiu precisa continuar tendo onde ser
  // confirmada depois que setembro começa.
  const idsDoCiclo = useMemo(() => new Set(sales.map((s) => s.id)), [sales])
  const vendasParaConferir = useMemo(
    () => listaParaConferencia(sales, pendentesTotais),
    [sales, pendentesTotais],
  )

  const barberById = useMemo(() => new Map(barbers.map((barber) => [barber.id, barber])), [barbers])
  const barberStats = useMemo(() => {
    const porBarbeiro = desempenhoPorBarbeiro(barbers.map((b) => b.id), spins, sales)
    return porBarbeiro
      .map((d) => {
        const barber = barberById.get(d.barbeiroId)
        return barber ? { ...barber, ...d } : null
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
  }, [barbers, barberById, sales, spins])

  function run(action: () => Promise<{ ok?: boolean; error?: string }>, success: string) {
    if (isPending) return
    setError('')
    setMessage('')
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) {
          setError(result.error)
          return
        }
        setMessage(success)
        setDraft(null)
        setEditingSale(null)
        setConfirmingSale(null)
        router.refresh()
      } catch {
        setError('A conexão falhou. Nada foi alterado; tente novamente.')
      }
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
      // O valor não é definido na oferta — ele é informado quando o dono
      // confirma a venda (o prêmio pode ser algo que o cliente escolhe).
      revenueCents: 0,
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
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-[#d8ff00]/20 bg-gradient-to-br from-[#151811] via-surface to-surface p-4 shadow-[0_18px_45px_rgba(0,0,0,.16)] sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#d8ff00]/[0.08] blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d8ff00] text-lg font-black text-[#11110f] shadow-[0_8px_24px_rgba(216,255,0,.14)]">✓</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8ff00]">Central Brindoleta · acesso ativo</p>
            <p className="mt-1 text-sm text-text-muted">Configure, divulgue e acompanhe as vendas sem código e sem outro login.</p>
          </div>
        </div>
          <Link href="/configuracoes" className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-bold text-text transition hover:border-[#d8ff00]/30 hover:bg-[#d8ff00]/[0.06]">Configurar empresa e equipe →</Link>
        </div>
      </div>

      <div className="sticky top-16 z-20 mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-border/80 bg-surface/95 p-1.5 shadow-lg backdrop-blur-md lg:top-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-center text-[10px] font-black transition sm:text-sm ${tab === item.id ? 'bg-[#d8ff00] text-[#11110f] shadow-[0_6px_18px_rgba(216,255,0,.12)]' : 'text-text-muted hover:bg-surface-2 hover:text-text'}`}
          >
            <TabIcon tab={item.id} />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </button>
        ))}
      </div>

      {(message || error) && (
        <div aria-live="polite" className={`mb-5 rounded-2xl border p-4 text-sm shadow-sm ${error ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>
          {error || message}
        </div>
      )}

      {tab === 'campaign' && (
        <div className="space-y-5">
          <section className="card relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#d8ff00]/[0.055] blur-2xl" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Campanha</p>
                <h2 className="mt-1 font-serif text-2xl text-text">Ofertas na roleta</h2>
                <p className="mt-1 text-sm text-text-muted">Até 6 itens ativos. A <strong className="text-text">chance</strong> é o <strong className="text-text">peso</strong> de cada oferta: peso maior sai mais. Não precisa somar 100.</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-text">{activeOffers.length}/6 ativas</span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${chanceTotal === 100 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>{chanceTotal === 100 ? '100% distribuído' : `${chanceTotal} pts de chance`}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" disabled={isPending} onClick={() => setDraft({ ...EMPTY_OFFER })} className="min-h-[46px] rounded-xl bg-[#d8ff00] px-5 py-3 text-sm font-black text-[#11110f] shadow-[0_10px_24px_rgba(216,255,0,.12)] transition hover:brightness-105 active:scale-[.99] disabled:opacity-50">＋ Nova oferta</button>
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
                    <input id="offer-color" type="color" value={/^#[0-9a-f]{6}$/i.test(draft.color) ? draft.color : '#d8ff00'} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="h-12 w-16 rounded-xl border border-border bg-surface-2 p-1" />
                    <input value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="input text-base sm:text-sm" aria-label="Cor hexadecimal" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="offer-chance">Chance de sair (peso)</label>
                  <input id="offer-chance" type="number" min="1" max="100" value={draft.chance} onChange={(event) => setDraft({ ...draft, chance: Number(event.target.value) })} className="input text-base sm:text-sm" />
                  <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                    É o <strong className="text-text">peso</strong> da oferta na roleta — quanto maior, mais ela sai.
                    Não precisa somar 100: uma oferta com peso <strong className="text-text">30</strong> sai o
                    <strong className="text-text"> dobro</strong> de uma com peso 15. A chance real de cada uma é o
                    peso dividido pela soma dos pesos ativos.
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="offer-stock">Estoque</label>
                  <input id="offer-stock" type="number" min="0" max="99999" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} className="input text-base sm:text-sm" />
                  <p className="mt-1.5 text-xs leading-relaxed text-text-muted">Quantas unidades desse prêmio podem sair. Ao esgotar, a oferta sai da roleta.</p>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text sm:col-span-2">
                  <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} className="h-5 w-5 accent-[#d8ff00]" />
                  Exibir na roleta
                </label>
                <p className="text-xs leading-relaxed text-text-muted sm:col-span-2">
                  💡 O <strong className="text-text">valor da venda</strong> não é pedido aqui — você informa na hora de
                  confirmar a venda, em <strong className="text-text">Resultados</strong>. Assim dá pra usar prêmios abertos
                  (ex.: “30% em serviços extras”, que o cliente escolhe).
                </p>
              </div>
              <button disabled={isPending} className="mt-5 min-h-[50px] w-full rounded-xl bg-[#d8ff00] px-5 py-3 font-black text-[#11110f] shadow-[0_10px_24px_rgba(216,255,0,.12)] transition hover:brightness-105 active:scale-[.995] disabled:opacity-50">
                {isPending ? 'Salvando…' : 'Salvar oferta'}
              </button>
            </form>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((offer) => (
              <article key={offer.id} className={`card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${offer.enabled ? '' : 'opacity-65'}`} style={{ borderLeftColor: offer.color, borderLeftWidth: 3 }}>
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${offer.color}, transparent)` }} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-text-muted">{offer.offer_type}</span>
                      <h3 className="mt-1 text-base font-bold text-text">{offer.title}</h3>
                      <p className="mt-1 text-sm text-text-muted">{offer.benefit}</p>
                    </div>
                    <button type="button" role="switch" aria-label={`${offer.enabled ? 'Desativar' : 'Ativar'} ${offer.title}`} aria-checked={offer.enabled} onClick={() => toggleOffer(offer)} disabled={isPending} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${offer.enabled ? 'bg-[#d8ff00]' : 'border border-border bg-surface-2'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${offer.enabled ? 'translate-x-[1.375rem]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-surface-2 p-2">
                      <span className="block text-text-muted">Chance de sair</span>
                      <strong className="text-text">{offer.enabled && chanceTotal > 0 ? `${Math.round((offer.chance / chanceTotal) * 100)}%` : '—'}</strong>
                      <span className="mt-0.5 block text-[10px] text-text-muted">peso {offer.chance}</span>
                    </div>
                    <div className="rounded-lg bg-surface-2 p-2">
                      <span className="block text-text-muted">Estoque</span>
                      <strong className="text-text">{offer.stock}</strong>
                      <span className="mt-0.5 block text-[10px] text-text-muted">unidades</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" disabled={isPending} onClick={() => setDraft(offerToDraft(offer))} className="btn-ghost min-h-[42px] flex-1 border border-border text-xs">Editar oferta</button>
                    <button type="button" disabled={isPending} onClick={() => window.confirm('Excluir esta oferta?') && run(() => deleteBrindoletaOffer(offer.id), 'Oferta excluída.')} className="btn-ghost min-h-[42px] border border-red-400/25 text-xs text-red-200">Excluir</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div className="space-y-5">
          <section className="card relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#35b7eb]/[0.08] blur-3xl" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff00]">Equipe & QR</p>
            <h2 className="mt-1 font-serif text-2xl text-text">Um QR Code por profissional</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">Mostre o código no celular ou imprima em 10 × 10 cm para colocar na bancada ou no espelho. Cada link identifica quem originou a venda.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {barbers.length > 0 && (
                <Link href="/dashboard/brindoleta/qr/todos" target="_blank" className="inline-flex min-h-[44px] items-center rounded-xl bg-[#d8ff00] px-4 text-sm font-black text-[#11110f] shadow-[0_8px_20px_rgba(216,255,0,.1)] transition hover:brightness-105">🖨️ Imprimir todos os QR</Link>
              )}
              <Link href="/configuracoes" className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-surface-2 px-4 text-sm font-bold text-text transition hover:border-[#d8ff00]/30">Cadastrar ou editar colaboradores →</Link>
            </div>
          </section>

          {barbers.length === 0 ? (
            <div className="card p-8 text-center text-sm text-text-muted">Cadastre pelo menos um barbeiro nas configurações do BarberMeta.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {barbers.map((barber) => {
                const url = `${publicBaseUrl}/brindoleta/${barber.link_codigo}`
                return (
                  <article key={barber.id} className="card overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
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
                    <div className="relative mx-auto my-5 w-fit rounded-2xl border-[6px] border-white bg-white p-1 shadow-[0_12px_30px_rgba(0,0,0,.2)]">
                      <BrindoletaQr value={url} label={`QR Code da Brindoleta de ${barber.nome}`} className="h-36 w-36" />
                    </div>
                    <p className="truncate rounded-xl border border-border bg-surface-2 p-2.5 text-[10px] text-text-muted">{url}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => copy(url, `Link de ${barber.nome} copiado.`)} className="btn-ghost min-h-[44px] border border-border text-xs">Copiar link</button>
                      <Link href={`/dashboard/brindoleta/qr/${barber.id}`} target="_blank" className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#d8ff00] px-3 py-2.5 text-center text-xs font-black text-[#11110f] shadow-[0_8px_20px_rgba(216,255,0,.1)]">Imprimir / PDF</Link>
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
          {navegacaoCicloSlot}

          <p className="px-1 text-xs leading-relaxed text-text-muted">
            Os números abaixo são <strong className="text-text">só do ciclo {cicloLabel}</strong>
            {ehCicloAtual ? ' (o que está correndo agora)' : ' (mês já fechado)'}.
            Cada ciclo tem o seu — o histórico continua aqui, é só voltar acima.
          </p>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Giros no ciclo" value={String(totais.giros)} />
            <Metric label="Ofertas aceitas" value={String(totais.aceitas)} />
            {/* Pendentes NÃO seguem o ciclo: é fila de trabalho. Uma venda de
                agosto que ninguém confirmou continua esperando decisão, e
                escondê-la na virada do mês tiraria dinheiro real da tela. */}
            <Metric label="Pendentes (todo o período)" value={String(pendentesTotais.length)} highlight />
            <Metric label="Vendas confirmadas" value={money(totais.receitaCents)} />
          </div>

          {pendentesTotais.some((v) => !sales.some((s) => s.id === v.id)) && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100">
              Há {pendentesTotais.filter((v) => !sales.some((s) => s.id === v.id)).length} venda(s) de outros
              ciclos ainda esperando sua confirmação. Elas continuam na lista de pendentes abaixo até você decidir —
              não somem na virada do mês.
            </p>
          )}

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
                          <p className="text-xs text-text-muted">{barber.confirmadas} venda{barber.confirmadas === 1 ? '' : 's'} confirmada{barber.confirmadas === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <strong className="shrink-0 text-sm text-[#d8ff00]">{money(barber.receitaCents)}</strong>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Giros</span><strong className="text-text">{barber.giros}</strong></div>
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Aceites</span><strong className="text-text">{barber.aceitas}</strong></div>
                      <div className="rounded-lg bg-surface p-2"><span className="block text-text-muted">Conversão</span><strong className="text-text">{barber.conversao}%</strong></div>
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

          {vendasParaConferir.length === 0 ? (
            <div className="card p-8 text-center text-sm text-text-muted">Nenhuma oferta aceita em {cicloLabel}.</div>
          ) : (
            <div className="space-y-3">
              {vendasParaConferir.map((sale) => {
                const barber = barberById.get(sale.barbeiro_id)
                const statusStyle = sale.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-300' : sale.status === 'rejected' ? 'bg-red-400/10 text-red-200' : 'bg-amber-400/10 text-amber-200'
                const statusLabel = sale.status === 'confirmed' ? 'Confirmada' : sale.status === 'rejected' ? 'Não realizada' : 'Aguardando confirmação'
                // Pendente de outro ciclo, trazida pra cá pra não ficar órfã.
                const deOutroCiclo = !idsDoCiclo.has(sale.id)
                return (
                  <article key={sale.id} className={`card p-4 sm:p-5 ${deOutroCiclo ? 'border-amber-400/30' : ''}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-text">{sale.customer_name}</h3>
                        <p className="mt-1 text-sm text-text-muted">{sale.offer_title} · {sale.benefit}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {barber?.nome ?? 'Colaborador'} · {dateTime(sale.created_at)}
                          {deOutroCiclo && (
                            <span className="ml-2 inline-flex rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                              de outro ciclo
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <strong className="block text-text">{sale.amount_cents > 0 ? money(sale.amount_cents) : '—'}</strong>
                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>{statusLabel}</span>
                      </div>
                    </div>

                    {editingSale?.id === sale.id ? (
                      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-surface-2 p-3 sm:grid-cols-[1fr_150px_auto]">
                        <input value={editCustomer} onChange={(event) => setEditCustomer(event.target.value)} className="input bg-surface text-base sm:text-sm" aria-label="Nome do cliente" />
                        <input value={editAmount} onChange={(event) => setEditAmount(event.target.value)} className="input bg-surface text-base sm:text-sm" inputMode="decimal" aria-label="Valor da venda" />
                        <button type="button" onClick={() => run(() => updateBrindoletaSale({ id: sale.id, customerName: editCustomer, amountCents: reaisToCents(editAmount) }), 'Venda editada.')} className="rounded-xl bg-[#d8ff00] px-4 py-2 text-xs font-black text-[#11110f]">Salvar</button>
                      </div>
                    ) : confirmingSale?.id === sale.id ? (
                      <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3">
                        <p className="text-sm font-semibold text-text">Quanto foi vendido de fato?</p>
                        <p className="mt-1 text-xs leading-relaxed text-text-muted">Informe o valor real da venda. Se foi um brinde sem valor, deixe em branco.</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">R$</span>
                            <input value={confirmAmount} autoFocus onChange={(event) => setConfirmAmount(event.target.value)} inputMode="decimal" placeholder="0,00" aria-label="Valor vendido" className="input bg-surface pl-9 text-base sm:text-sm" />
                          </div>
                          <button type="button" disabled={isPending} onClick={() => run(async () => {
                            const upd = await updateBrindoletaSale({ id: sale.id, customerName: sale.customer_name, amountCents: reaisToCents(confirmAmount) })
                            if (upd.error) return upd
                            return decideBrindoletaSale(sale.id, 'confirmed')
                          }, 'Venda confirmada e contabilizada.')} className="min-h-[42px] rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-emerald-950 shadow-sm transition hover:brightness-105 disabled:opacity-50">Confirmar venda</button>
                          <button type="button" onClick={() => setConfirmingSale(null)} className="btn-ghost min-h-[42px] border border-border text-xs">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {sale.status === 'pending' && (
                          <>
                            <button type="button" disabled={isPending} onClick={() => { setEditingSale(null); setConfirmingSale(sale); setConfirmAmount('') }} className="min-h-[42px] rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-emerald-950 shadow-sm transition hover:brightness-105 disabled:opacity-50">Confirmar venda</button>
                            <button type="button" disabled={isPending} onClick={() => window.confirm('Marcar como não realizada?') && run(() => decideBrindoletaSale(sale.id, 'rejected'), 'Venda marcada como não realizada.')} className="btn-ghost min-h-[42px] border border-border text-xs">Não realizada</button>
                          </>
                        )}
                        <button type="button" disabled={isPending} onClick={() => startSaleEdit(sale)} className="btn-ghost min-h-[42px] border border-border text-xs">Editar</button>
                        <button type="button" disabled={isPending} onClick={() => window.confirm('Excluir definitivamente este registro?') && run(() => deleteBrindoletaSale(sale.id), 'Venda excluída.')} className="btn-ghost min-h-[42px] border border-red-400/25 text-xs text-red-200">Excluir</button>
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
    <div className={`card relative overflow-hidden p-4 shadow-sm ${highlight ? 'border-[#d8ff00]/30 bg-[#d8ff00]/[0.035]' : ''}`}>
      {highlight && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#d8ff00] shadow-[0_0_8px_#d8ff00]" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <strong className={`mt-2 block text-2xl ${highlight ? 'text-[#d8ff00]' : 'text-text'}`}>{value}</strong>
    </div>
  )
}

function TabIcon({ tab }: { tab: Tab }) {
  const common = 'h-4 w-4 shrink-0'
  if (tab === 'campaign') return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7.8-4.5M12 12l-7.8 4.5" /></svg>
  if (tab === 'qr') return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2" /></svg>
  if (tab === 'results') return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.8-1.1 1.9M12 17h.01" /></svg>
}

function Guide({ businessName }: { businessName: string }) {
  const topics = [
    ['1. Prepare as ofertas', 'Cadastre até 6 benefícios com nome curto, descrição clara, estoque e o peso (chance) de cada um. O valor da venda não entra aqui — você informa ao confirmar.'],
    ['2. Gere os QR Codes', 'Abra Equipe & QR, confira cada profissional e imprima o cartão em 10 × 10 cm.'],
    ['3. Posicione no atendimento', 'Deixe o QR na bancada ou no espelho, sem reflexo e ao alcance da câmera do cliente.'],
    ['4. Oriente o cliente', 'Explique que ele ganhou um giro. A descrição completa aparece somente depois que a roleta parar.'],
    ['5. Converta a oferta', 'Se o cliente aceitar, ele informa apenas o nome. A solicitação entra como venda pendente.'],
    ['6. Confirme diariamente', 'Em Resultados, confirme só as vendas realizadas e informe quanto foi vendido — esse valor é o que entra no faturamento da campanha.'],
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
