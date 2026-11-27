import EditorConfig from '@/components/admin/EditorConfig'
import ListaEditavel from '@/components/admin/ListaEditavel'
import { requireAdmin } from '@/lib/auth'
import { VENDAS_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'
import { excluirItem, salvarItem } from './actions'

export default async function AdminVendas() {
  const { supabase } = await requireAdmin()
  const [vendas, { data: depo }, { data: faqs }] = await Promise.all([
    lerConfig('vendas', VENDAS_PADRAO),
    supabase.from('mdc_testimonials').select('*').order('ordem'),
    supabase.from('mdc_faqs').select('*').order('ordem'),
  ])

  async function salvarDepo(id: string | null, d: Record<string, unknown>) {
    'use server'
    await salvarItem('mdc_testimonials', id, d)
  }
  async function excluirDepo(id: string) {
    'use server'
    await excluirItem('mdc_testimonials', id)
  }
  async function salvarFaq(id: string | null, d: Record<string, unknown>) {
    'use server'
    await salvarItem('mdc_faqs', id, d)
  }
  async function excluirFaq(id: string) {
    'use server'
    await excluirItem('mdc_faqs', id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Página de vendas</h1>
        <p className="text-suave">
          Tudo que aparece em <a href="/mdc" target="_blank" className="text-latao underline">/mdc</a>. Os preços dos planos ficam fixos no sistema.
        </p>
      </div>

      <ListaEditavel
        titulo="Resultados de mentorados"
        itens={(depo ?? []) as never}
        resumo="nome"
        novoPadrao={{ ativo: true, ordem: (depo?.length ?? 0) + 1 }}
        campos={[
          { nome: 'nome', rotulo: 'Nome' },
          { nome: 'local', rotulo: 'Barbearia e cidade' },
          { nome: 'texto', rotulo: 'Resultado / depoimento', tipo: 'area' },
          { nome: 'foto_url', rotulo: 'Foto', tipo: 'imagem' },
          { nome: 'ordem', rotulo: 'Ordem', tipo: 'numero' },
          { nome: 'ativo', rotulo: 'Mostrar na página', tipo: 'check' },
        ]}
        salvar={salvarDepo}
        excluir={excluirDepo}
      />

      <ListaEditavel
        titulo="Perguntas frequentes"
        itens={(faqs ?? []) as never}
        resumo="pergunta"
        novoPadrao={{ ativo: true, ordem: (faqs?.length ?? 0) + 1 }}
        campos={[
          { nome: 'pergunta', rotulo: 'Pergunta' },
          { nome: 'resposta', rotulo: 'Resposta', tipo: 'area' },
          { nome: 'ordem', rotulo: 'Ordem', tipo: 'numero' },
          { nome: 'ativo', rotulo: 'Mostrar na página', tipo: 'check' },
        ]}
        salvar={salvarFaq}
        excluir={excluirFaq}
      />

      <EditorConfig
        chave="vendas"
        titulo="Textos da página de vendas"
        descricao="Campo vazio volta para o texto padrão (os que estão entre [colchetes] são para trocar)."
        valor={vendas}
        campos={[
          { nome: 'titulo', rotulo: '1. Título', tipo: 'area', linhas: 2 },
          { nome: 'promessa', rotulo: '1. Promessa', tipo: 'area' },
          { nome: 'botao', rotulo: 'Texto do botão de compra' },
          { nome: 'para_quem_titulo', rotulo: '2. Título “Para quem é”' },
          { nome: 'para_quem', rotulo: '2. Para quem é', tipo: 'lista' },
          { nome: 'pilares_titulo', rotulo: '3. Título dos pilares' },
          { nome: 'pilares_texto', rotulo: '3. Texto dos pilares', tipo: 'area' },
          { nome: 'pilares', rotulo: '3. Os 5 pilares', tipo: 'lista' },
          { nome: 'como_funciona_titulo', rotulo: '4. Título “Como funciona”' },
          { nome: 'como_funciona', rotulo: '4. Como funciona', tipo: 'lista' },
          { nome: 'carlos_titulo', rotulo: '5. Título “Quem é o Carlos”' },
          { nome: 'carlos_texto', rotulo: '5. Texto sobre o Carlos', tipo: 'area', linhas: 8 },
          { nome: 'carlos_foto_url', rotulo: '5. Foto do Carlos', tipo: 'imagem' },
          { nome: 'resultados_titulo', rotulo: '6. Título dos resultados' },
          { nome: 'preco_titulo', rotulo: '7. Título do preço' },
          { nome: 'preco_texto', rotulo: '7. Texto do preço', tipo: 'area' },
          { nome: 'faq_titulo', rotulo: '8. Título das perguntas' },
          { nome: 'final_titulo', rotulo: '9. Chamada final' },
          { nome: 'final_texto', rotulo: '9. Texto final', tipo: 'area' },
        ]}
      />
    </div>
  )
}
