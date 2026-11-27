import Link from 'next/link'
import { requireMembro, STATUS_EXIBIDO } from '@/lib/membro'
import { lerConfig } from '@/lib/settings'
import { LINKS_PADRAO } from '@/lib/defaults'
import { dataBR, diasEntre, hojeSP, reais } from '@/lib/format'
import { plano } from '@/lib/planos'

export default async function MeuPlano() {
  const { membro, status, semana } = await requireMembro()
  const links = await lerConfig('links_membros', LINKS_PADRAO)
  const p = plano(membro.plano)
  const faltam = membro.vencimento ? diasEntre(hojeSP(), membro.vencimento) : 0

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Meu plano</h1>
      <section className="card divide-y divide-linha">
        <Linha r="Plano" v={p?.nome ?? membro.plano} />
        <Linha r="Valor" v={p ? reais(p.valor) + (p.meses === 1 ? ' por mês' : ' por semestre') : '—'} />
        <Linha r="Status" v={<span className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${STATUS_EXIBIDO[status].cor}`}>{STATUS_EXIBIDO[status].rotulo}</span>} />
        <Linha r="Começou em" v={dataBR(membro.data_inicio)} />
        <Linha r="Vence em" v={`${dataBR(membro.vencimento)}${faltam >= 0 ? ` (${faltam === 0 ? 'hoje' : `faltam ${faltam} dias`})` : ''}`} />
        <Linha r="Sua semana" v={semana > 0 ? String(semana) : '—'} />
        {membro.fundador && <Linha r="Turma" v="Fundador · 18/01/2027" />}
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">Como renovar</h2>
        <p className="mt-2 whitespace-pre-line text-suave">{links.renovacao_texto}</p>
        <Link href="/renovar" className="btn-primario mt-5 w-full sm:w-full">Renovar agora</Link>
      </section>
    </div>
  )
}

function Linha({ r, v }: { r: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <span className="text-suave">{r}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  )
}
