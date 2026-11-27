import Link from 'next/link'
import BotaoWhatsapp from '@/components/admin/BotaoWhatsapp'
import { requireAdmin } from '@/lib/auth'
import { MSGS_VENCIMENTO_PADRAO, PAGAMENTO_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'
import { dataBR, formatarWhatsapp, hojeSP, preencher, primeiroNome, reais, somarDias } from '@/lib/format'
import { plano } from '@/lib/planos'
import type { Membro } from '@/lib/membro'

export default async function Vencimentos() {
  const { supabase } = await requireAdmin()
  const hoje = hojeSP()
  const em5 = somarDias(hoje, 5)
  const ontem = somarDias(hoje, -1)
  const [{ data }, msgs, pag] = await Promise.all([
    supabase.from('mdc_members').select('*').eq('status', 'ativo').in('vencimento', [em5, hoje, ontem]).order('nome'),
    lerConfig('msgs_vencimento', MSGS_VENCIMENTO_PADRAO),
    lerConfig('pagamento', PAGAMENTO_PADRAO),
  ])
  const membros = (data as Membro[]) ?? []

  const grupos = [
    { titulo: 'Vence em 5 dias', data: em5, modelo: msgs.antes },
    { titulo: 'Vence hoje', data: hoje, modelo: msgs.dia },
    { titulo: 'Venceu ontem', data: ontem, modelo: msgs.depois },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Vencimentos</h1>
        <p className="text-suave">
          Hoje é {dataBR(hoje)}. Os modelos das mensagens ficam em <Link href="/admin/configuracoes#msgs_vencimento" className="text-latao underline">Textos e links</Link>.
        </p>
      </div>
      {grupos.map((g) => {
        const lista = membros.filter((m) => m.vencimento === g.data)
        return (
          <section key={g.titulo} className="card p-5">
            <h2 className="text-xl font-bold">
              {g.titulo} <span className="text-suave">· {dataBR(g.data)} · {lista.length}</span>
            </h2>
            {lista.length === 0 ? (
              <p className="mt-3 text-suave">Ninguém.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha">
                {lista.map((m) => {
                  const p = plano(m.plano)
                  const msg = preencher(g.modelo, {
                    nome: primeiroNome(m.nome),
                    data: dataBR(m.vencimento),
                    plano: p?.nome ?? m.plano,
                    valor: reais(p?.valor ?? 0),
                    chave: pag.pix_chave || '[chave Pix não configurada]',
                    link_cartao: pag.infinitepay_url || '',
                  })
                  return (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <Link href={`/admin/membros/${m.id}`} className="font-bold hover:text-latao">{m.nome}</Link>
                        <p className="text-sm text-suave">
                          {formatarWhatsapp(m.whatsapp)} · {p?.curto} · {reais(p?.valor ?? 0)}
                        </p>
                      </div>
                      <BotaoWhatsapp whatsapp={m.whatsapp} mensagem={msg} rotulo="Mandar no WhatsApp" />
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
