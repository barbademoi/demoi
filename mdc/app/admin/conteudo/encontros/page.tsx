import ListaEditavel from '@/components/admin/ListaEditavel'
import { requireAdmin } from '@/lib/auth'
import { dataBR, hojeSP } from '@/lib/format'
import { excluirItem, salvarItem } from '@/app/admin/vendas/actions'
import { NIVEIS, SEMANAS_CICLO } from '../opcoes'

export default async function Encontros() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('meetings').select('*').order('data', { ascending: false })
  const itens = (data ?? []).map((m) => ({
    ...m,
    nivel: String(m.nivel),
    semana: String(m.semana),
    _rotulo: `${m.is_ultimo ? '★ ÚLTIMO · ' : ''}${dataBR(m.data)} · N${m.nivel} S${m.semana} · ${m.tema}${m.pdf_path ? ' · PDF' : ''}${m.youtube_url ? ' · vídeo' : ''}`,
  }))

  async function salvar(id: string | null, d: Record<string, unknown>) {
    'use server'
    await salvarItem('meetings', id, d)
  }
  async function excluir(id: string) {
    'use server'
    await excluirItem('meetings', id)
  }

  return (
    <div className="space-y-4">
      <p className="text-suave">
        Cada encontro fica na biblioteca na semana do ciclo (1 a 13). Marque “último encontro” para ele aparecer no início de
        todos os membros, mesmo quem ainda não chegou nessa semana.
      </p>
      <ListaEditavel
        titulo="Encontros"
        itens={itens as never}
        resumo="_rotulo"
        novoPadrao={{ nivel: '1', semana: '1', data: hojeSP(), is_ultimo: true }}
        campos={[
          { nome: 'nivel', rotulo: 'Nível', tipo: 'select', opcoes: NIVEIS },
          { nome: 'semana', rotulo: 'Semana do ciclo', tipo: 'select', opcoes: SEMANAS_CICLO },
          { nome: 'data', rotulo: 'Data do encontro', tipo: 'data' },
          { nome: 'tema', rotulo: 'Tema' },
          { nome: 'pdf_path', rotulo: 'Resumo em PDF', tipo: 'arquivo', pasta: 'encontros' },
          { nome: 'youtube_url', rotulo: 'Link do YouTube (não listado)', ajuda: 'Ex.: https://youtu.be/xxxxxxxxxxx' },
          { nome: 'is_ultimo', rotulo: 'É o último encontro (aparece no início de todos)', tipo: 'check' },
        ]}
        salvar={salvar}
        excluir={excluir}
      />
    </div>
  )
}
