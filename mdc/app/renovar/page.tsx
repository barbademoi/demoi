import { redirect } from 'next/navigation'
import Marca from '@/components/Marca'
import InfoPagamento from '@/components/compra/InfoPagamento'
import EnvioComprovante from '@/components/compra/EnvioComprovante'
import { buscarMembro, statusExibido } from '@/lib/membro'
import { lerConfig } from '@/lib/settings'
import { PAGAMENTO_PADRAO } from '@/lib/defaults'
import { dataBR } from '@/lib/format'
import { plano as acharPlano, PLANOS } from '@/lib/planos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Renovar — MDC' }

export default async function Renovar({ searchParams }: { searchParams: { plano?: string } }) {
  const { supabase, user, membro } = await buscarMembro()
  if (!user) redirect('/entrar?next=/renovar')
  if (!membro) redirect('/comprar')
  const st = statusExibido(membro)
  if (st === 'pendente') redirect('/comprar/pagamento')
  if (st === 'aguardando') redirect('/aguardando')

  const p = acharPlano(searchParams.plano) ?? acharPlano(membro.plano) ?? PLANOS[0]
  const [cfg, { data: enviado }] = await Promise.all([
    lerConfig('pagamento', PAGAMENTO_PADRAO),
    supabase.from('mdc_payments').select('id, created_at').eq('member_id', user.id).eq('status', 'enviado').limit(1).maybeSingle(),
  ])
  const emDia = st === 'ativo' || st === 'vence_em_breve'

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <Marca />
      <div className="pt-8">
        {st === 'cancelado' ? (
          <>
            <h1 className="text-3xl font-black">Sua conta está cancelada</h1>
            <p className="mt-3 text-lg text-suave">Quer voltar pro MDC? Escolha o plano, pague e mande o comprovante que a gente reativa.</p>
          </>
        ) : emDia ? (
          <>
            <h1 className="text-3xl font-black">Renovar antes de vencer</h1>
            <p className="mt-3 text-lg text-suave">Seu plano vale até {dataBR(membro.vencimento)}. Renovando agora, os dias novos entram depois dessa data.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black">Seu plano venceu</h1>
            <p className="mt-3 text-lg text-suave">
              Venceu em {dataBR(membro.vencimento)}. Renove pra continuar com acesso aos encontros, missões e materiais.
            </p>
          </>
        )}

        {enviado ? (
          <div className="card mt-8 p-6 text-center">
            <p className="text-2xl font-black">Recebemos!</p>
            <p className="mt-2 text-suave">Assim que o pagamento for confirmado, seu acesso é liberado.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-2">
              {PLANOS.map((x) => (
                <a key={x.id} href={`/renovar?plano=${x.id}`} className={`chip justify-between ${x.id === p.id ? 'chip-ativo' : ''}`}>
                  <span className="font-semibold">{x.nome}</span>
                  <span className="text-sm text-suave">{x.destaque}</span>
                </a>
              ))}
            </div>
            <section className="card mt-4 p-5">
              <InfoPagamento plano={p} cfg={cfg} />
            </section>
            <div className="mt-6">
              <EnvioComprovante userId={user.id} plano={p.id} destino="/renovar" />
            </div>
          </>
        )}
        {emDia && (
          <a href="/app" className="btn-secundario mt-4 w-full sm:w-full">Voltar para a área do membro</a>
        )}
        <form action="/sair" method="post" className="mt-6 text-center">
          <button className="text-sm text-suave underline">Sair</button>
        </form>
      </div>
    </main>
  )
}
