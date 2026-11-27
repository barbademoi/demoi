// Textos e valores padrão. Valem enquanto o admin não editar nada; o que for
// salvo em "settings" no banco passa por cima, campo a campo.

export type Landing = {
  titulo: string
  subtitulo: string
  texto: string
  beneficios_titulo: string
  beneficios: string[]
  nao_titulo: string
  nao_e_pra_voce: string[]
  form_titulo: string
  botao: string
  confirmacao_titulo: string
  confirmacao_texto: string
  confirmacao_botao: string
}

export const LANDING_PADRAO: Landing = {
  titulo: 'Rotina, equipe e números no lugar em 90 dias.',
  subtitulo:
    'A mentoria em grupo pra dono de barbearia do interior. Feita por quem faz: R$ 60 mil por mês numa cidade de 17 mil habitantes.',
  texto: `Aqui não tem fórmula de capital. Tem o que a gente faz todo dia na Demôi, em Cássia-MG: atendimento humanizado, equipe formada em casa, combinado escrito e número olhado todo dia.

No MDC você tem encontro ao vivo comigo toda segunda, missões pra aplicar na sua barbearia e os materiais que a gente usa aqui, prontos pra adaptar.

A primeira turma começa dia 18 de janeiro e tem só 20 vagas. Quem está na lista fica sabendo primeiro.`,
  beneficios_titulo: 'O que vem no MDC',
  beneficios: [
    'Encontro ao vivo toda segunda, 2 horas: 1 de tema e 1 de perguntas',
    'Missões toda semana, pra quem trabalha sozinho ou com equipe',
    'Kit Demôi: os materiais que a gente usa aqui, prontos pra adaptar',
    'Acesso ao BarberMeta e ao Tarefix',
    'Gravação e resumo de todos os encontros',
  ],
  nao_titulo: 'Não é pra você se...',
  nao_e_pra_voce: [
    'Você quer fórmula mágica',
    'Você não vai executar',
    'Você culpa a equipe por tudo',
    'Você quer resultado sem mudar nada',
    'Sua barbearia já está 100% organizada',
  ],
  form_titulo: 'Entre na lista de espera',
  botao: 'Quero entrar na lista',
  confirmacao_titulo: 'Pronto, você está na lista!',
  confirmacao_texto:
    'Agora entra no grupo de espera. É lá que vão rolar os bastidores da Demôi, a live de apresentação e é lá que as vendas abrem primeiro, antes de todo mundo.',
  confirmacao_botao: 'Entrar no grupo de espera',
}

export const MSG_LEAD_PADRAO =
  'Oi, [Nome]! Aqui é o Carlos, da Demôi. Vi que você entrou na lista de espera do MDC. Posso te contar como vai funcionar a mentoria?'

// ── Fase 2 ────────────────────────────────────────────────────────────────

export type Vendas = {
  titulo: string
  promessa: string
  botao: string
  para_quem_titulo: string
  para_quem: string[]
  pilares_titulo: string
  pilares: string[]
  pilares_texto: string
  como_funciona_titulo: string
  como_funciona: string[]
  carlos_titulo: string
  carlos_texto: string
  carlos_foto_url: string
  resultados_titulo: string
  preco_titulo: string
  preco_texto: string
  faq_titulo: string
  final_titulo: string
  final_texto: string
}

export const VENDAS_PADRAO: Vendas = {
  titulo: 'Rotina, equipe e números no lugar em 90 dias.',
  promessa: '[Promessa principal — texto do Carlos vai aqui]',
  botao: 'Quero entrar no MDC',
  para_quem_titulo: 'Para quem é',
  para_quem: [
    '[Dono de barbearia do interior que ...]',
    '[Quem trabalha sozinho na cadeira e quer ...]',
    '[Quem tem equipe e precisa ...]',
  ],
  pilares_titulo: 'O que muda em 90 dias',
  pilares: ['Dono', 'Ambiente e atendimento', 'Equipe', 'Números e retenção', 'Crescimento'],
  pilares_texto: '[Texto curto explicando os 5 pilares]',
  como_funciona_titulo: 'Como funciona',
  como_funciona: [
    'Encontro ao vivo toda segunda, das 15h às 17h, no Google Meet',
    'Missões toda semana, pra quem trabalha sozinho ou com equipe',
    'Kit Demôi: os materiais que a gente usa aqui, prontos pra adaptar',
    'Acesso ao BarberMeta e ao Tarefix',
    'Gravação e resumo de todos os encontros',
  ],
  carlos_titulo: 'Quem é o Carlos',
  carlos_texto: '[Texto sobre o Carlos Henrique Demôi]',
  carlos_foto_url: '',
  resultados_titulo: 'Resultados de mentorados',
  preco_titulo: 'Escolha seu plano',
  preco_texto: '[Texto sobre o investimento]',
  faq_titulo: 'Perguntas frequentes',
  final_titulo: '[Chamada final]',
  final_texto: '[Texto final antes do botão]',
}

export type Termo = { versao: string; texto: string }

export const TERMO_PADRAO: Termo = {
  versao: 'v1-rascunho',
  texto: '[Cole aqui o termo de adesão da mentoria MDC.]',
}

export type Pagamento = {
  infinitepay_url: string
  pix_chave: string
  pix_nome: string
  pix_cidade: string
  pix_qr_url: string
  pix_instrucoes: string
}

export const PAGAMENTO_PADRAO: Pagamento = {
  infinitepay_url: '',
  pix_chave: '',
  pix_nome: '',
  pix_cidade: 'Cassia',
  pix_qr_url: '',
  pix_instrucoes: 'Depois de pagar, toque em “Já paguei” e mande o comprovante.',
}

export type MsgsVencimento = { antes: string; dia: string; depois: string }

export const MSGS_VENCIMENTO_PADRAO: MsgsVencimento = {
  antes:
    '[Nome], tudo bem? Seu plano do MDC vence dia [data]. Já pode renovar pelo Pix abaixo, que sua vaga continua garantida.\n\nValor: [valor]\nChave Pix: [chave]',
  dia: '[Nome], tudo bem? Seu plano do MDC ([plano]) vence hoje, [data].\n\nValor da renovação: [valor]\nChave Pix: [chave]\n\nAguardamos o comprovante para renovarmos!',
  depois: '[Nome], tudo certo? Seu plano venceu ontem. Posso manter sua vaga?',
}

// ── Fase 3 ────────────────────────────────────────────────────────────────

export type LinksMembros = {
  meet_url: string
  grupo_membros_url: string
  barbermeta_url: string
  tarefix_url: string
  renovacao_texto: string
}

export const LINKS_PADRAO: LinksMembros = {
  meet_url: '',
  grupo_membros_url: '',
  barbermeta_url: 'https://www.barbermeta.com.br',
  tarefix_url: 'https://www.barbermeta.com.br/tarefix',
  renovacao_texto:
    'Pra renovar, é só pagar pelo Pix ou cartão e mandar o comprovante pela tela de renovação. Se preferir, chama a gente no grupo.',
}
