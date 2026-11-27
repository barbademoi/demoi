import Link from 'next/link'
import ListaEditavel from '@/components/admin/ListaEditavel'
import { requireAdmin } from '@/lib/auth'
import { excluirItem, salvarItem } from '@/app/admin/vendas/actions'
import { PERFIS_MISSAO, TIPOS_MISSAO } from '../opcoes'

export default async function ModelosMissao({ searchParams }: { searchParams: { semana?: string } }) {
  const { supabase } = await requireAdmin()
  const [{ data }, { data: kits }] = await Promise.all([
    supabase.from('mdc_mission_templates').select('*').order('semana').order('tipo').order('ordem'),
    supabase.from('mdc_kit_materials').select('id, nivel, semana, titulo').order('nivel').order('semana'),
  ])
  const todos = data ?? []
  const semanas = Array.from(new Set(todos.map((t) => t.semana as number))).sort((a, b) => a - b)
  const filtro = searchParams.semana ? Number(searchParams.semana) : null
  const lista = filtro ? todos.filter((t) => t.semana === filtro) : todos

  const perfil = (p: string) => PERFIS_MISSAO.find((x) => x.valor === p)?.rotulo ?? p
  const itens = lista.map((t) => ({
    ...t,
    semana: String(t.semana),
    kit_material_id: t.kit_material_id ?? '',
    _rotulo: `Sem. ${t.semana} · ${t.tipo === 'habito_diario' ? 'Hábito' : 'Missão'} · ${perfil(t.perfil)} · ${t.titulo}`,
  }))
  const opcoesKit = [{ valor: '', rotulo: 'Nenhum' }, ...(kits ?? []).map((k) => ({ valor: k.id, rotulo: `N${k.nivel} S${k.semana} · ${k.titulo}` }))]

  async function salvar(id: string | null, d: Record<string, unknown>) {
    'use server'
    const s = Number(d.semana)
    if (!(s >= 1 && s <= 200)) throw new Error('Semana entre 1 e 200.')
    if (!String(d.titulo ?? '').trim()) throw new Error('Coloque o título.')
    await salvarItem('mdc_mission_templates', id, d)
  }
  async function excluir(id: string) {
    'use server'
    await excluirItem('mdc_mission_templates', id)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 text-sm text-suave">
        <p>
          <strong className="text-texto">Semana</strong> = semana do membro (1, 2, 3… da semana 14 em diante é nível 2).
        </p>
        <p className="mt-1">
          <strong className="text-texto">Hábito diário</strong> entra na semana escolhida e continua nas seguintes.{' '}
          <strong className="text-texto">Missão da semana</strong> vale só naquela semana (o ideal é 1 ou 2 por semana).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/conteudo/missoes" className={`btn-sm border ${!filtro ? 'border-latao bg-latao text-fundo' : 'border-linha text-suave'}`}>Todas</Link>
        {semanas.map((s) => (
          <Link key={s} href={`/admin/conteudo/missoes?semana=${s}`} className={`btn-sm border ${filtro === s ? 'border-latao bg-latao text-fundo' : 'border-linha text-suave'}`}>
            Sem. {s}
          </Link>
        ))}
      </div>
      <ListaEditavel
        titulo={`Modelos de missão (${lista.length})`}
        itens={itens as never}
        resumo="_rotulo"
        novoPadrao={{ perfil: 'ambos', semana: String(filtro ?? 1), tipo: 'missao_semana', ordem: 1, ativo: true, kit_material_id: '' }}
        campos={[
          { nome: 'perfil', rotulo: 'Perfil', tipo: 'select', opcoes: PERFIS_MISSAO },
          { nome: 'semana', rotulo: 'Semana do membro', tipo: 'numero' },
          { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_MISSAO },
          { nome: 'titulo', rotulo: 'Título' },
          { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' },
          { nome: 'kit_material_id', rotulo: 'Material do Kit ligado', tipo: 'select', opcoes: opcoesKit },
          { nome: 'ordem', rotulo: 'Ordem', tipo: 'numero' },
          { nome: 'ativo', rotulo: 'Ativo', tipo: 'check' },
        ]}
        salvar={salvar}
        excluir={excluir}
      />
    </div>
  )
}
