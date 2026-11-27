import EditorConfig from '@/components/admin/EditorConfig'
import { requireAdmin } from '@/lib/auth'
import { LANDING_PADRAO, MSG_LEAD_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'

export default async function Configuracoes() {
  await requireAdmin()
  const [landing, grupo, msgLead] = await Promise.all([
    lerConfig('landing', LANDING_PADRAO),
    lerConfig('grupo_espera_url', ''),
    lerConfig('msg_lead', MSG_LEAD_PADRAO),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Textos e links</h1>
        <p className="text-suave">O que você salvar aqui aparece no site na hora.</p>
      </div>

      <EditorConfig
        chave="grupo_espera_url"
        titulo="Link do grupo de espera"
        descricao="Botão da tela de confirmação, depois que a pessoa entra na lista."
        valor={grupo}
        tipoSimples="url"
        ajudaSimples="Ex.: https://chat.whatsapp.com/..."
      />

      <EditorConfig
        chave="msg_lead"
        titulo="Mensagem do WhatsApp para leads"
        descricao="Mensagem pronta do botão “Chamar no WhatsApp”. Dá pra editar antes de mandar."
        valor={msgLead}
        tipoSimples="area"
        ajudaSimples="Use [Nome] para o primeiro nome da pessoa."
      />

      <EditorConfig
        chave="landing"
        titulo="Página da lista de espera (/)"
        descricao="Campo deixado vazio volta para o texto padrão."
        valor={landing}
        campos={[
          { nome: 'titulo', rotulo: 'Título', tipo: 'area', linhas: 2 },
          { nome: 'subtitulo', rotulo: 'Subtítulo', tipo: 'area', linhas: 3 },
          { nome: 'texto', rotulo: 'Texto', tipo: 'area', linhas: 10, ajuda: 'Deixe uma linha em branco entre os parágrafos.' },
          { nome: 'beneficios_titulo', rotulo: 'Título do bloco de benefícios' },
          { nome: 'beneficios', rotulo: 'O que vem no MDC', tipo: 'lista' },
          { nome: 'nao_titulo', rotulo: 'Título do bloco “Não é pra você”' },
          { nome: 'nao_e_pra_voce', rotulo: 'Não é pra você se...', tipo: 'lista' },
          { nome: 'form_titulo', rotulo: 'Título do formulário' },
          { nome: 'botao', rotulo: 'Texto do botão' },
          { nome: 'confirmacao_titulo', rotulo: 'Confirmação: título' },
          { nome: 'confirmacao_texto', rotulo: 'Confirmação: texto', tipo: 'area', linhas: 4 },
          { nome: 'confirmacao_botao', rotulo: 'Confirmação: texto do botão' },
        ]}
      />
    </div>
  )
}
