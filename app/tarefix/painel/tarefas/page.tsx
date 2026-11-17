import Link from 'next/link'
import { exigirDono } from '@/lib/tarefix/dono'
import { hojeSP, somarDias } from '@/lib/tarefix/datas'
import type { TarefaAvulsa, TarefaModelo } from '@/lib/tarefix/tipos'
import { Avatar, Titulo, Vazio } from '@/components/tarefix/ui'
import { EditorTarefas } from './EditorTarefas'
import { listarSugestoes } from '@/lib/tarefix/sugestoes'
import { garantirEu } from '@/lib/tarefix/meuDia'
import { ROTINA_DONO } from '@/lib/tarefix/rotinaDono'
import type { Categoria } from '@/lib/tarefix/tipos'

export const metadata = { title: 'Tarefas' }

export default async function Tarefas({ searchParams }: { searchParams: { c?: string } }) {
  const { db, empresa, dono } = await exigirDono()
  const eu = await garantirEu(dono, empresa)
  const { data: colaboradores } = await db
    .from('colaboradores')
    .select('id, nome, foto_url, ativo')
    .eq('eh_dono', false)
    .order('ativo', { ascending: false })
    .order('nome')

  // "Eu" (Meu dia) sempre primeiro; depois a equipe
  const lista = [{ id: eu.id, nome: 'Eu', foto_url: eu.foto_url, ativo: true }, ...(colaboradores ?? [])]
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

  // sem ?c=: com equipe abre no primeiro colaborador; sem equipe, no "Eu"
  const atual = lista.find((c) => c.id === searchParams.c) ?? lista.slice(1).find((c) => c.ativo) ?? lista[0]
  const hoje = hojeSP()
  const ehEu = atual.id === eu.id
  const [{ data: modelos }, { data: avulsas }, sugestoesEquipe, { data: categorias }] = await Promise.all([
    db.from('tarefas_modelo').select('*').eq('colaborador_id', atual.id).order('ordem').order('criado_em'),
    db
      .from('tarefas_avulsas')
      .select('*')
      .eq('colaborador_id', atual.id)
      .gte('data', somarDias(hoje, -14))
      .order('data')
      .order('criado_em'),
    ehEu ? Promise.resolve(null) : listarSugestoes(),
    db.from('categorias').select('id, empresa_id, nome, cor, ordem').order('ordem').order('criado_em'),
  ])
  const sugestoes = ehEu ? ROTINA_DONO : sugestoesEquipe

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
        colaborador={{ id: atual.id, nome: ehEu ? `${dono.nome.split(' ')[0]} (Meu dia)` : atual.nome }}
        categorias={ehEu ? ((categorias ?? []) as Categoria[]) : []}
        modelos={(modelos ?? []) as TarefaModelo[]}
        avulsas={(avulsas ?? []) as TarefaAvulsa[]}
        hoje={hoje}
        sugestoes={sugestoes && { ...sugestoes, empresaId: '' }}
        referencia={!ehEu && sugestoes?.empresaId === empresa.id}
      />
    </>
  )
}
