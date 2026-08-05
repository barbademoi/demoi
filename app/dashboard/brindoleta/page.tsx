import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import BrindoletaDemo from '@/components/brindoleta/BrindoletaDemo'
import BrindoletaPanel from '@/components/brindoleta/BrindoletaPanel'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import {
  BRINDOLETA_PRICE_LABEL,
  brindoletaPaymentConfig,
  type BrindoletaStatus,
} from '@/lib/brindoleta/config'
import type {
  BrindoletaBarber,
  BrindoletaOffer,
  BrindoletaSale,
  BrindoletaSpin,
} from '@/lib/brindoleta/types'
import BrindoletaCheckout from './BrindoletaCheckout'

export const metadata = { title: 'Brindoleta — BarberMeta' }
export const dynamic = 'force-dynamic'

type UsuarioComBarbearia = {
  barbearia_id: string
  barbearias: { id: string; nome: string; logo_url: string | null } | null
}

export default async function BrindoletaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, logo_url)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario?.barbearia_id || !usuario.barbearias) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: licenseRaw } = await (supabase as any)
    .from('brindoleta_licenses')
    .select('status')
    .eq('barbearia_id', usuario.barbearia_id)
    .maybeSingle()

  const status = (licenseRaw?.status ?? null) as BrindoletaStatus | null
  const payment = brindoletaPaymentConfig()
  const isAdmin = emailEhAdminCortesia(user.email)

  let offers: BrindoletaOffer[] = []
  let barbers: BrindoletaBarber[] = []
  let spins: BrindoletaSpin[] = []
  let sales: BrindoletaSale[] = []
  let publicBaseUrl = ''
  let panelError = ''

  if (status === 'active') {
    const [offersResult, barbersResult, spinsResult, salesResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('brindoleta_offers').select('*')
        .eq('barbearia_id', usuario.barbearia_id).order('created_at', { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('barbeiros').select('id, nome, foto_url, link_codigo, tipo')
        .eq('barbearia_id', usuario.barbearia_id).eq('ativo', true).order('nome'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('brindoleta_spins').select('id, barbeiro_id, offer_id, created_at')
        .eq('barbearia_id', usuario.barbearia_id).order('created_at', { ascending: false }).limit(500),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('brindoleta_sales')
        .select('id, spin_id, barbeiro_id, offer_id, customer_name, offer_title, benefit, amount_cents, status, created_at, decided_at')
        .eq('barbearia_id', usuario.barbearia_id).order('created_at', { ascending: false }).limit(500),
    ])
    offers = (offersResult.data ?? []) as BrindoletaOffer[]
    barbers = (barbersResult.data ?? []) as BrindoletaBarber[]
    spins = (spinsResult.data ?? []) as BrindoletaSpin[]
    sales = (salesResult.data ?? []) as BrindoletaSale[]

    const dataError = offersResult.error ?? barbersResult.error ?? spinsResult.error ?? salesResult.error
    if (dataError) {
      console.error('[brindoleta/painel] falha ao carregar dados:', dataError)
      panelError = 'Não foi possível carregar a central da Brindoleta. Atualize a página em instantes; nenhuma configuração foi alterada.'
    }

    const requestHeaders = headers()
    const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
    if (host) {
      const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
      publicBaseUrl = `${protocol}://${host}`
    }
  }

  return (
    <div className="bm-theme min-h-screen flex">
      <Sidebar barbeariaNome={usuario.barbearias.nome} brindoletaStatus={status} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 lg:pl-[calc(16rem+2rem)] lg:pr-8 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{status === 'active' ? 'Central de vendas interativa' : 'Novo no BarberMeta'}</p>
              <h1 className="mt-2 font-serif text-3xl text-text sm:text-4xl">Brindoleta</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                {status === 'active'
                  ? 'Crie ofertas, distribua os QR Codes da equipe e acompanhe cada oportunidade gerada no atendimento.'
                  : 'Transforme o atendimento em uma oportunidade de vender serviços extras, produtos e benefícios de um jeito leve e divertido.'}
              </p>
            </div>
            {isAdmin && (
              <Link href="/admin/brindoleta" className="btn-ghost border border-border text-sm">
                Conferir pagamentos
              </Link>
            )}
          </div>

          {status === 'active' ? (
            panelError ? (
              <section className="card border-amber-400/25 p-6 text-center sm:p-8">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-xl text-amber-200">!</span>
                <h2 className="mt-4 font-serif text-2xl text-text">A central está temporariamente indisponível</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">{panelError}</p>
              </section>
            ) : (
              <BrindoletaPanel
                businessName={usuario.barbearias.nome}
                publicBaseUrl={publicBaseUrl}
                offers={offers}
                barbers={barbers}
                spins={spins}
                sales={sales}
              />
            )
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <section className="space-y-5">
                <div id="demonstracao" className="card scroll-mt-24 overflow-hidden">
                  <BrindoletaDemo />
                  <div className="p-5 sm:p-7">
                    <h2 className="font-serif text-2xl text-text">Uma roleta feita para vender mais</h2>
                    <ul className="mt-5 space-y-4 text-sm leading-relaxed text-text-muted">
                      <li className="flex gap-3"><span className="text-primary">✓</span><span>Cadastre até 6 ofertas entre serviços, produtos e brindes.</span></li>
                      <li className="flex gap-3"><span className="text-primary">✓</span><span>Tenha um QR Code por colaborador e acompanhe quem gerou cada venda.</span></li>
                      <li className="flex gap-3"><span className="text-primary">✓</span><span>Confirme vendas, acompanhe resultados e descubra as ofertas que mais convertem.</span></li>
                      <li className="flex gap-3"><span className="text-primary">✓</span><span>Pagamento único: sem mensalidade da Brindoleta.</span></li>
                    </ul>

                    <div className="mt-6 rounded-2xl border border-[#d8ff00]/25 bg-[#d8ff00]/[0.06] p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d8ff00] text-[#11110f]">
                          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <rect x="3" y="3" width="6" height="6" rx="1" />
                            <rect x="15" y="3" width="6" height="6" rx="1" />
                            <rect x="3" y="15" width="6" height="6" rx="1" />
                            <path d="M13 13h3v3h-3zM18 13h3M21 13v4M13 18v3h4M19 19h2v2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7e9200]">Como funciona no atendimento</p>
                          <h3 className="mt-1 text-base font-bold text-text">Um QR Code exclusivo para cada barbeiro</h3>
                          <p className="mt-2 text-sm leading-relaxed text-text-muted">
                            O cliente escaneia o código e abre a roleta vinculada àquele profissional. Assim, o sistema identifica quem apresentou a oportunidade e acompanha as vendas geradas por cada colaborador.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-[#d8ff00]/20 bg-[#11110f] px-4 py-3 text-sm leading-relaxed text-white/75">
                        <strong className="text-[#d8ff00]">Dica:</strong> o barbeiro pode mostrar o QR Code na tela do próprio celular ou baixar e imprimir para deixá-lo na bancada ou no espelho, sempre ao alcance da câmera do cliente.
                      </div>
                    </div>
                  </div>
                </div>

                {status === 'rejected' && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-400/[0.08] p-5 text-sm text-red-100">
                    O pagamento anterior não foi localizado. Confira os dados e envie um novo pedido; se precisar, fale com o suporte.
                  </div>
                )}
                {status === 'suspended' && (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-5 text-sm text-amber-100">
                    Este acesso está temporariamente suspenso. Fale com o suporte para regularizar.
                  </div>
                )}
              </section>

              <div id="comprar" className="scroll-mt-24">
                <BrindoletaCheckout
                  pixKey={payment.pixKey}
                  pixReceiver={payment.pixReceiver}
                  pixQrImageUrl={payment.pixQrImageUrl}
                  pixPaymentUrl={payment.pixPaymentUrl}
                  priceLabel={BRINDOLETA_PRICE_LABEL}
                  pending={status === 'pending'}
                  empresaNome={usuario.barbearias.nome}
                  ownerEmail={user.email ?? ''}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
