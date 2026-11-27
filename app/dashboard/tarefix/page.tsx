import Link from 'next/link'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Logo } from '@/components/tarefix/Logo'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { TAREFIX_PRICE_LABEL, tarefixPaymentConfig, type TarefixLicencaStatus } from '@/lib/tarefixModulo/config'
import TarefixCheckout from './TarefixCheckout'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import BotaoComoFunciona from './BotaoComoFunciona'

export const metadata = { title: 'Tarefix — BarberMeta' }
export const dynamic = 'force-dynamic'

const BENEFICIOS: [string, string, string][] = [
  ['📋', 'Tarefas da equipe organizadas', 'Abrir a barbearia, limpar, repor produtos, postar… cada um sabe o que fazer e até que horas.'],
  ['📱', 'No celular, sem baixar app', 'Cada colaborador recebe um link com PIN. Funciona em qualquer celular.'],
  ['📷', 'Prova com foto e checklist', 'Peça a foto da bancada limpa ou o passo a passo marcado. Você aprova ou devolve.'],
  ['📊', 'Você acompanha em tempo real', 'Veja quem fez, quem atrasou e a % do dia e do mês de cada um.'],
  ['🏆', 'Bônus por desempenho', 'Opcional: premie quem cumpre 90% ou 100% das tarefas no mês.'],
  ['🔔', 'Lembretes automáticos', 'Notificação na hora da tarefa e resumo do dia para você.'],
  ['🔥', 'Meu dia: as suas tarefas', 'Sua lista pessoal de dono, com lembretes e sequência de dias.'],
]

export default async function TarefixModuloPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single()
  if (!usuario?.barbearia_id || !usuario.barbearias) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lic } = await (supabase as any)
    .from('tarefix_licencas')
    .select('status, rejection_reason')
    .eq('barbearia_id', usuario.barbearia_id)
    .maybeSingle()
  const status = (lic?.status ?? null) as TarefixLicencaStatus | null
  // quem já tinha um Tarefix antes do módulo pago (ou ganhou do admin) continua com ele
  const { data: jaDono } = status === 'active' ? { data: null } : await createTarefixAdmin().from('donos').select('id').eq('id', user.id).maybeSingle()
  const liberado = status === 'active' || (Boolean(jaDono) && status !== 'suspended')
  const pay = tarefixPaymentConfig()
  const isAdmin = emailEhAdminCortesia(user.email)
  const nome = usuario.barbearias.nome as string

  return (
    <div className="bm-theme flex min-h-screen">
      <Sidebar barbeariaNome={nome} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 lg:pl-[calc(16rem+2rem)] lg:pr-8 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{liberado ? 'Módulo liberado' : 'Novo no BarberMeta'}</p>
              <h1 className="mt-3">
                <Logo className="text-5xl" claro />
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                A rotina da sua barbearia organizada: tarefas da equipe no celular, com prova, lembretes e acompanhamento em tempo real.
              </p>
            </div>
            {isAdmin && (
              <Link href="/admin/tarefix" className="btn-ghost border border-border text-sm">
                Conferir pagamentos
              </Link>
            )}
          </div>

          {liberado ? (
            <section className="card p-6 text-center sm:p-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B3DF5] text-2xl text-white">✓</span>
              <h2 className="mt-4 font-serif text-3xl text-text">Seu Tarefix está pronto</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                Ele abre com o mesmo login do BarberMeta. Comece cadastrando a equipe e as primeiras tarefas: o próprio Tarefix te guia no primeiro acesso.
              </p>
              <a href="/tarefix/painel" className="mt-6 inline-flex rounded-xl bg-[#5B3DF5] px-8 py-4 text-base font-black text-white hover:brightness-110">
                Abrir o Tarefix →
              </a>
              <p className="mt-4 text-xs text-text-muted">Dica: no celular, abra o Tarefix e use “Adicionar à tela de início” para ter o ícone dele.</p>
            </section>
          ) : status === 'suspended' ? (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-6 text-sm text-amber-100">
              Este acesso está temporariamente suspenso. Fale com o suporte para regularizar.
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <section className="space-y-5">
                <div className="card overflow-hidden">
                  <div className="bg-[radial-gradient(circle_at_top_right,rgba(91,61,245,0.35),transparent_55%)] p-5 sm:p-7">
                    <h2 className="font-serif text-2xl text-text">Chega de cobrar a equipe no grupo</h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      Você monta as tarefas uma vez. O Tarefix lembra cada um na hora certa, recebe a prova e mostra para você quem cumpriu.
                    </p>
                    <BotaoComoFunciona className="mt-5 w-full rounded-xl bg-[#5B3DF5] px-5 py-3.5 text-sm font-black text-white hover:brightness-110 sm:w-auto" texto="▶ Ver como funciona, passo a passo" />
                  </div>
                  <ul className="grid gap-4 border-t border-border p-5 sm:grid-cols-2 sm:p-7">
                    {BENEFICIOS.map(([icone, titulo, texto]) => (
                      <li key={titulo} className="flex gap-3">
                        <span className="text-xl" aria-hidden>
                          {icone}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-text">{titulo}</span>
                          <span className="block text-sm leading-relaxed text-text-muted">{texto}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-border px-5 py-4 text-sm text-text-muted sm:px-7">
                    <span className="text-primary">✓</span> Pagamento único de {TAREFIX_PRICE_LABEL}: sem mensalidade do Tarefix.
                  </p>
                </div>
                {status === 'rejected' && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-400/[0.08] p-5 text-sm text-red-100">
                    O pagamento anterior não foi localizado{lic?.rejection_reason ? ` (${lic.rejection_reason})` : ''}. Confira os dados e envie um novo pedido; se precisar, fale com o suporte.
                  </div>
                )}
              </section>

              <div id="comprar" className="scroll-mt-24">
                <TarefixCheckout
                  pixKey={pay.pixKey}
                  pixReceiver={pay.pixReceiver}
                  pixQrImageUrl={pay.pixQrImageUrl}
                  pixPaymentUrl={pay.pixPaymentUrl}
                  priceLabel={TAREFIX_PRICE_LABEL}
                  pending={status === 'pending'}
                  empresaNome={nome}
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
