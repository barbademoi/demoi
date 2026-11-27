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
