import Link from 'next/link'
import { exigirDono } from '@/lib/tarefix/dono'
import { dataPorExtenso, hojeSP, horarioCurto } from '@/lib/tarefix/datas'
import { Titulo } from '@/components/tarefix/ui'

export const metadata = { title: 'Hoje' }

export default async function PainelHoje() {
  const { db, dono, empresa } = await exigirDono()
  const [funcoes, colaboradores, modelos] = await Promise.all([
    db.from('funcoes').select('*', { count: 'exact', head: true }),
    db.from('colaboradores').select('*', { count: 'exact', head: true }).eq('ativo', true),
    db.from('tarefas_modelo').select('*', { count: 'exact', head: true }).eq('ativo', true),
  ])
  const passos = [
    { feito: (funcoes.count ?? 0) > 0, titulo: 'Cadastre as funções', texto: 'Ex.: Atendimento, Limpeza, Caixa.', href: '/tarefix/painel/funcoes' },
    { feito: (colaboradores.count ?? 0) > 0, titulo: 'Cadastre a equipe', texto: 'Nome, foto, função e PIN de cada um.', href: '/tarefix/painel/colaboradores' },
    { feito: (modelos.count ?? 0) > 0, titulo: 'Monte as tarefas', texto: 'O que cada um faz em cada dia da semana.', href: '/tarefix/painel/tarefas' },
  ]
  const primeiroNome = dono.nome.split(' ')[0]

  return (
    <>
      <Titulo>Olá, {primeiroNome}</Titulo>
      <p className="-mt-3 mb-6 text-tf-suave first-letter:uppercase">
        {dataPorExtenso(hojeSP())} · fecha às {horarioCurto(empresa.horario_fechamento)}
      </p>

      <section className="tf-cartao divide-y divide-tf-borda">
        {passos.map((p, i) => (
          <Link key={p.href} href={p.href} className="flex min-h-[72px] items-center gap-4 px-5 py-4 hover:bg-tf-marca-clara/50">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                p.feito ? 'bg-tf-marca text-white' : 'bg-tf-marca-clara text-tf-marca-texto'
              }`}
            >
              {p.feito ? '✓' : i + 1}
            </span>
            <span className="flex-1">
              <span className="block font-bold">{p.titulo}</span>
              <span className="block text-sm text-tf-suave">{p.texto}</span>
            </span>
            <span className="text-xl text-tf-suave" aria-hidden>›</span>
          </Link>
        ))}
      </section>

      <p className="mt-6 text-sm text-tf-suave">
        O acompanhamento do dia (termômetros, fotos, reprovação e extras) aparece aqui na próxima etapa.
      </p>
    </>
  )
}
