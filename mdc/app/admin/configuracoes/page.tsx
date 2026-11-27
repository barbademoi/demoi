import EditorConfig from '@/components/admin/EditorConfig'
import { requireAdmin } from '@/lib/auth'
import { LANDING_PADRAO, MSG_LEAD_PADRAO, MSGS_VENCIMENTO_PADRAO, PAGAMENTO_PADRAO, TERMO_PADRAO, LINKS_PADRAO } from '@/lib/defaults'
import { lerConfig } from '@/lib/settings'

export default async function Configuracoes() {
  await requireAdmin()
  const [landing, grupo, msgLead, pagamento, termo, msgsVenc, linksMembros] = await Promise.all([
    lerConfig('landing', LANDING_PADRAO),
    lerConfig('grupo_espera_url', ''),
    lerConfig('msg_lead', MSG_LEAD_PADRAO),
    lerConfig('pagamento', PAGAMENTO_PADRAO),
    lerConfig('termo', TERMO_PADRAO),
    lerConfig('msgs_vencimento', MSGS_VENCIMENTO_PADRAO),
    lerConfig('links_membros', LINKS_PADRAO),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Textos e links</h1>
        <p className="text-suave">O que você salvar aqui aparece no site na hora.</p>
      </div>

      <EditorConfig
        chave="links_membros"
        titulo="Links da área do membro"
        descricao="Só membros ativos veem."
        valor={linksMembros}
        campos={[
          { nome: 'meet_url', rotulo: 'Link do Google Meet (encontro de segunda)', tipo: 'url' },
          { nome: 'grupo_membros_url', rotulo: 'Link do grupo do WhatsApp dos membros', tipo: 'url' },
          { nome: 'barbermeta_url', rotulo: 'Link do BarberMeta', tipo: 'url' },
          { nome: 'tarefix_url', rotulo: 'Link do Tarefix', tipo: 'url' },
          { nome: 'renovacao_texto', rotulo: 'Instruções de renovação (Meu plano)', tipo: 'area', linhas: 3 },
        ]}
      />

      <EditorConfig
        chave="pagamento"
        titulo="Pagamento"
        descricao="Aparece na compra e na renovação. Com chave, nome e cidade preenchidos, o QR Code do Pix é gerado sozinho com o valor de cada plano."
        valor={pagamento}
        campos={[
          { nome: 'infinitepay_url', rotulo: 'Link de pagamento da InfinitePay (cartão, R$ 997 em até 6x)', tipo: 'url' },
          { nome: 'pix_chave', rotulo: 'Chave Pix' },
          { nome: 'pix_nome', rotulo: 'Nome do recebedor (como aparece no banco)' },
          { nome: 'pix_cidade', rotulo: 'Cidade do recebedor' },
          { nome: 'pix_qr_url', rotulo: 'QR Code do Pix (opcional — só usado se faltar nome/cidade acima)', tipo: 'imagem' },
          { nome: 'pix_instrucoes', rotulo: 'Instrução abaixo do Pix', tipo: 'area', linhas: 2 },
        ]}
      />

      <EditorConfig
        chave="termo"
        titulo="Termo de adesão"
        descricao="Ao mudar o texto, mude também a versão: cada aceite fica salvo com a versão que a pessoa aceitou."
        valor={termo}
        campos={[
          { nome: 'versao', rotulo: 'Versão (ex.: 2026-12-01)' },
          { nome: 'texto', rotulo: 'Texto do termo', tipo: 'area', linhas: 14 },
        ]}
      />

      <EditorConfig
        chave="msgs_vencimento"
        titulo="Mensagens de vencimento (WhatsApp)"
        descricao="Use [Nome], [data], [plano], [valor], [chave] e [link_cartao]."
        valor={msgsVenc}
        campos={[
          { nome: 'antes', rotulo: '5 dias antes', tipo: 'area', linhas: 5 },
          { nome: 'dia', rotulo: 'No dia', tipo: 'area', linhas: 6 },
          { nome: 'depois', rotulo: '1 dia depois', tipo: 'area', linhas: 3 },
        ]}
      />

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
