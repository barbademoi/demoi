import ListaEditavel from '@/components/admin/ListaEditavel'
import { requireAdmin } from '@/lib/auth'
import { excluirItem, salvarItem } from '@/app/admin/vendas/actions'
import { NIVEIS, SEMANAS_CICLO } from '../opcoes'

export default async function Kit() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('kit_materials').select('*').order('nivel').order('semana').order('ordem')
  const itens = (data ?? []).map((k) => ({ ...k, nivel: String(k.nivel), semana: String(k.semana), _rotulo: `N${k.nivel} S${k.semana} · ${k.titulo}` }))

  async function salvar(id: string | null, d: Record<string, unknown>) {
    'use server'
    if (!d.file_path) throw new Error('Envie o PDF antes de salvar.')
    await salvarItem('kit_materials', id, d)
  }
  async function excluir(id: string) {
    'use server'
    await excluirItem('kit_materials', id)
  }

  return (
    <div className="space-y-4">
      <p className="text-suave">PDFs do Kit Demôi. Cada material abre junto com a semana dele e pode ser ligado a uma missão.</p>
      <ListaEditavel
        titulo="Materiais do Kit"
        itens={itens as never}
        resumo="_rotulo"
        novoPadrao={{ nivel: '1', semana: '1', ordem: 1 }}
        campos={[
          { nome: 'nivel', rotulo: 'Nível', tipo: 'select', opcoes: NIVEIS },
          { nome: 'semana', rotulo: 'Semana', tipo: 'select', opcoes: SEMANAS_CICLO },
          { nome: 'titulo', rotulo: 'Título' },
          { nome: 'descricao', rotulo: 'Descrição (opcional)', tipo: 'area' },
          { nome: 'file_path', rotulo: 'Arquivo', tipo: 'arquivo', pasta: 'kit' },
          { nome: 'ordem', rotulo: 'Ordem', tipo: 'numero' },
        ]}
        salvar={salvar}
        excluir={excluir}
      />
    </div>
  )
}
