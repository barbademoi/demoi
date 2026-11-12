import Link from 'next/link'
import { exigirDono } from '@/lib/tarefix/dono'
import { hojeSP, somarDias } from '@/lib/tarefix/datas'
import type { TarefaAvulsa, TarefaModelo } from '@/lib/tarefix/tipos'
import { Avatar, Titulo, Vazio } from '@/components/tarefix/ui'
import { EditorTarefas } from './EditorTarefas'

export const metadata = { title: 'Tarefas' }

export default async function Tarefas({ searchParams }: { searchParams: { c?: string } }) {
  const { db } = await exigirDono()
  const { data: colaboradores } = await db
    .from('colaboradores')
    .select('id, nome, foto_url, ativo')
    .order('ativo', { ascending: false })
    .order('nome')

  const lista = colaboradores ?? []
  if (lista.length === 0) {
    return (
      <>
        <Titulo>Tarefas</Titulo>
        <Vazio
          titulo="Cadastre a equipe primeiro"
          texto="As tarefas são montadas por colaborador."
          acao={<Link href="/tarefix/painel/colaboradores" className="tf-botao">Ir para Equipe</Link>}
        />
      </>
    )
  }

  const atual = lista.find((c) => c.id === searchParams.c) ?? lista.find((c) => c.ativo) ?? lista[0]
  const hoje = hojeSP()
  const [{ data: modelos }, { data: avulsas }] = await Promise.all([
    db.from('tarefas_modelo').select('*').eq('colaborador_id', atual.id).order('ordem').order('criado_em'),
    db
      .from('tarefas_avulsas')
      .select('*')
      .eq('colaborador_id', atual.id)
      .gte('data', somarDias(hoje, -14))
      .order('data')
      .order('criado_em'),
  ])

  return (
    <>
      <Titulo>Tarefas</Titulo>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {lista.map((c) => (
          <Link
            key={c.id}
            href={`/tarefix/painel/tarefas?c=${c.id}`}
            className={`flex min-h-[48px] shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-4 font-bold transition ${
              c.id === atual.id ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda bg-tf-card text-tf-texto'
            } ${c.ativo ? '' : 'opacity-50'}`}
          >
            <Avatar nome={c.nome} url={c.foto_url} tamanho={36} />
            {c.nome.split(' ')[0]}
          </Link>
        ))}
      </div>
      <EditorTarefas
        key={atual.id}
        colaborador={{ id: atual.id, nome: atual.nome }}
        modelos={(modelos ?? []) as TarefaModelo[]}
        avulsas={(avulsas ?? []) as TarefaAvulsa[]}
        hoje={hoje}
      />
    </>
  )
}
