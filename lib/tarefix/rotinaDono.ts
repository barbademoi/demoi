import type { Sugestao, Sugestoes } from '@/lib/tarefix/sugestoes'

/**
 * Sugestões de rotina para o DONO usar no Meu dia (lista fixa).
 * Os grupos têm o mesmo nome das categorias padrão: ao copiar, a tarefa já
 * entra na categoria certa.
 */

const T = (id: string, grupo: string, titulo: string, o: Partial<Sugestao> = {}): Sugestao => ({
  id: `rotina-${id}`,
  grupo,
  titulo,
  descricao: null,
  dias_semana: [1, 2, 3, 4, 5, 6],
  horario_inicio: null,
  horario_limite: null,
  tempo_estimado_min: null,
  continua: false,
  peso: 1,
  exige_foto: false,
  checklist: [],
  ...o,
})

const grupos: Sugestoes['grupos'] = [
  {
    nome: 'Barbearia',
    itens: [
      T('agenda', 'Barbearia', 'Conferir a agenda do dia e os horários vagos', { horario_inicio: '08:30', tempo_estimado_min: 10, descricao: 'Horário vago até as 12h? Manda story ou mensagem para a lista de clientes.' }),
      T('equipe', 'Barbearia', 'Alinhar o dia com a equipe (5 min)', { horario_inicio: '08:50', tempo_estimado_min: 5, peso: 2 }),
      T('painel', 'Barbearia', 'Olhar o painel do Tarefix e as fotos da equipe', { horario_inicio: '21:00', tempo_estimado_min: 5 }),
      T('estoque', 'Barbearia', 'Conferir o estoque e fazer o pedido', { dias_semana: [1], horario_inicio: '11:00', tempo_estimado_min: 20, checklist: ['Pomadas e finalizadores', 'Lâminas e navalhas', 'Toalhas e capas', 'Café e água'] }),
      T('amanha', 'Barbearia', 'Ver a agenda de amanhã e confirmar os clientes', { horario_inicio: '19:00', tempo_estimado_min: 10 }),
      T('conteudo', 'Barbearia', 'Postar conteúdo (stories ou reels)', { horario_inicio: '12:00', tempo_estimado_min: 15, peso: 2 }),
      T('feedback', 'Barbearia', 'Responder avaliações e mensagens de clientes', { dias_semana: [1, 3, 5], horario_inicio: '14:00', tempo_estimado_min: 15 }),
      T('reuniao', 'Barbearia', 'Reunião rápida da semana com a equipe', { dias_semana: [1], horario_inicio: '09:00', tempo_estimado_min: 20, checklist: ['Resultado da semana passada', 'Meta da semana', 'O que melhorar', 'Elogios'] }),
    ],
  },
  {
    nome: 'Finanças',
    itens: [
      T('caixa', 'Finanças', 'Fechar o caixa e conferir o faturamento do dia', { horario_inicio: '20:30', tempo_estimado_min: 15, peso: 2, checklist: ['Dinheiro', 'Cartão', 'Pix', 'Bater com o sistema'] }),
      T('contas', 'Finanças', 'Ver as contas a pagar da semana', { dias_semana: [1], horario_inicio: '10:00', tempo_estimado_min: 15 }),
      T('comissoes', 'Finanças', 'Conferir comissões da equipe', { dias_semana: [6], horario_inicio: '18:00', tempo_estimado_min: 20 }),
    ],
  },
  {
    nome: 'Pessoal',
    itens: [
      T('planejar', 'Pessoal', 'Planejar o dia: as 3 coisas mais importantes', { horario_inicio: '07:30', tempo_estimado_min: 10, peso: 2 }),
      T('estudo', 'Pessoal', 'Estudar 20 min (gestão, marketing ou técnica)', { horario_inicio: '22:00', tempo_estimado_min: 20 }),
      T('familia', 'Pessoal', 'Tempo com a família, sem celular', { dias_semana: [0], horario_inicio: '12:00' }),
    ],
  },
  {
    nome: 'Saúde',
    itens: [
      T('agua', 'Saúde', 'Beber 2 litros de água', { dias_semana: [0, 1, 2, 3, 4, 5, 6], continua: true }),
      T('treino', 'Saúde', 'Treinar ou caminhar 30 min', { dias_semana: [1, 3, 5], horario_inicio: '06:30', tempo_estimado_min: 30, peso: 2 }),
      T('almoco', 'Saúde', 'Almoçar com calma (pelo menos 20 min)', { horario_inicio: '13:00', tempo_estimado_min: 20 }),
    ],
  },
]

export const ROTINA_DONO: Sugestoes = {
  origem: 'Rotina do dono',
  empresaId: '',
  grupos,
  total: grupos.reduce((n, g) => n + g.itens.length, 0),
}
