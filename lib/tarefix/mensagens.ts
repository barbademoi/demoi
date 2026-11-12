/**
 * Banco de mensagens do Tarefix, por MOMENTO e por TOM.
 * Variáveis: {nome}, {total}, {faltam}, {minutos}, {percentual}, {motivo}.
 *
 * Regras de tom: nunca humilhar, nunca comparar com colegas, nunca piada em
 * reprovação (a mensagem de reprovada é a mesma nos dois tons).
 */

export type Tom = 'zoeira' | 'neutro'

export type Momento =
  | 'abertura'
  | 'primeira_feita'
  | 'andamento'
  | 'reta_final'
  | 'metade'
  | 'falta_uma'
  | 'dia_100'
  | 'foto_enviada'
  | 'extra'
  | 'amarelo'
  | 'vermelho'
  | 'perto_fechamento'
  | 'bonus_perto'
  | 'sequencia'
  | 'evolucao'
  | 'reprovada'

export type Variaveis = Partial<Record<'nome' | 'total' | 'faltam' | 'minutos' | 'percentual' | 'motivo', string | number>>

const REPROVADA = ["Uma tarefa voltou: '{motivo}'. Bora acertar."]

export const MENSAGENS: Record<Momento, Record<Tom, string[]>> = {
  abertura: {
    zoeira: [
      "Bom dia, {nome}. {total} tarefas hoje. Nenhuma delas é 'mexer no celular', infelizmente.",
      'A lista do dia tá pronta. Ela não se faz sozinha. A gente testou.',
      '{nome}, são {total} tarefas. Café na mão e bora riscar.',
      'Lista nova, dia novo. A primeira é sempre a mais difícil de começar.',
      '{total} tarefas te esperando. Elas são pacientes, mas o relógio não.',
      'Bora, {nome}. A lista tá aí parada, olhando pra você.',
    ],
    neutro: [
      'Bom dia, {nome}! Você tem {total} tarefas hoje.',
      'Olá, {nome}. Sua lista de hoje tem {total} tarefas.',
      '{total} tarefas para hoje. Bom trabalho, {nome}!',
      'Sua lista do dia está pronta, {nome}.',
      'Vamos começar? São {total} tarefas hoje.',
    ],
  },
  primeira_feita: {
    zoeira: [
      'Primeira de muitas. Ou de {total}, pra ser exato.',
      'Uma já foi. O motor esquentou.',
      'Saiu a primeira. Agora é ladeira abaixo.',
      'Primeiro check do dia. O resto da lista ficou com inveja.',
      'Começou bem. Agora não para, que a lista sente cheiro de pausa.',
    ],
    neutro: [
      'Primeira tarefa concluída!',
      'Boa! Uma já foi.',
      'Primeira tarefa feita. Continue assim.',
      'Ótimo começo, {nome}.',
      'Uma a menos na lista.',
    ],
  },
  andamento: {
    zoeira: [
      'Tá rendendo. Faltam {faltam} e a lista já sentiu o golpe.',
      'Ritmo bom. Mais {faltam} e a gente conversa sobre confete.',
      'A lista tá encolhendo. Faltam {faltam}, segue o baile.',
      'Embalou, hein? Ainda tem {faltam} na fila.',
      'Pegou no tranco. Faltam {faltam}, não deixa o motor esfriar.',
    ],
    neutro: [
      'Bom ritmo! Faltam {faltam} tarefas.',
      'Você está avançando bem. Restam {faltam}.',
      'Continue assim: faltam {faltam} tarefas.',
      'Progresso constante, {nome}. Faltam {faltam}.',
      'Boa sequência! Ainda há {faltam} tarefas.',
    ],
  },
  reta_final: {
    zoeira: [
      'Reta final: só {faltam}. Dá pra ver a linha de chegada daqui.',
      'Faltam {faltam}. A lista já tá pedindo arrego.',
      'Só {faltam} entre você e o dia 100%. Bora fechar a conta.',
      'Passou da metade faz tempo. Faltam {faltam}, acelera que é descida.',
      '{faltam} tarefas. É pouco. Muito pouco. Vai lá.',
    ],
    neutro: [
      'Reta final: faltam {faltam} tarefas.',
      'Quase lá, {nome}! Restam {faltam}.',
      'Falta pouco: {faltam} tarefas para completar o dia.',
      'Mais {faltam} e o dia fica 100%.',
      'Você já passou da metade. Faltam {faltam}.',
    ],
  },
  metade: {
    zoeira: [
      'Metade feita. A outra metade tá te olhando.',
      'Meio caminho andado. O outro meio não anda sozinho.',
      '50%. Tecnicamente você já pode dizer que fez metade do dia.',
      'Metade da lista riscada. A outra metade tá suando frio.',
      'Chegou na metade. Daqui pra frente é descida.',
    ],
    neutro: [
      'Metade das tarefas concluída.',
      'Você já fez metade da lista.',
      'Meio caminho andado. Continue!',
      'Metade feita, faltam {faltam}.',
      'Boa, {nome}! Metade do dia concluída.',
    ],
  },
  falta_uma: {
    zoeira: [
      'Falta uma. UMA. Não deixa ela sozinha aí.',
      'Só uma separando você do confete.',
      'A última tá ali, se achando importante. Mostra quem manda.',
      'Uma tarefa. Um check. Um dia 100%. Faz as contas.',
      'Falta só uma. Ela tá com medo de você.',
    ],
    neutro: [
      'Só falta uma tarefa.',
      'Falta apenas uma para o dia 100%.',
      'Quase lá, {nome}! Só mais uma.',
      'Última tarefa do dia te esperando.',
      'Mais uma e a lista fica completa.',
    ],
  },
  dia_100: {
    zoeira: [
      'Dia 100%. Pode sair andando em câmera lenta.',
      'Zerou a lista. Se fosse videogame tinha troféu. Como não é, toma confete.',
      'Lista zerada. Pode ir no café com a consciência limpa.',
      '100%. A lista pediu arrego.',
      'Tudo feito. Hoje você foi a versão premium de você.',
      'Lista completa. Pode guardar esse print pra mostrar pros netos.',
    ],
    neutro: [
      'Dia 100%. Ótimo trabalho!',
      'Todas as tarefas concluídas. Parabéns, {nome}!',
      'Lista completa! Excelente dia.',
      'Você concluiu tudo hoje. Muito bem!',
      '100% das tarefas feitas. Obrigado, {nome}!',
    ],
  },
  foto_enviada: {
    zoeira: [
      'Foto enviada. Prova registrada, e ainda ficou bonita.',
      'Sem foto, não aconteceu. Regra da internet, regra do Tarefix.',
      'Clique registrado. Fotógrafo oficial do dia.',
      'Foto no sistema. Agora é fato, não é papo.',
      'Registrado com foto. Dá até pra emoldurar.',
    ],
    neutro: [
      'Foto enviada com a tarefa.',
      'Tarefa concluída com foto.',
      'Foto registrada. Obrigado!',
      'Pronto, a foto foi enviada.',
      'Tarefa e foto registradas.',
    ],
  },
  extra: {
    zoeira: [
      'Ninguém pediu, você fez. Isso tem nome: diferença.',
      'Extra registrada. Você tá jogando no modo difícil.',
      'Fez além da lista. A lista ficou até sem graça.',
      'Tarefa extra no sistema. Isso não passa despercebido.',
      'Foi além. Literalmente fora da lista.',
    ],
    neutro: [
      'Tarefa extra registrada. Obrigado!',
      'Extra registrada. Ela será avaliada em breve.',
      'Obrigado pela iniciativa, {nome}!',
      'Sua tarefa extra foi enviada para aprovação.',
      'Registrado! Esforço extra faz diferença.',
    ],
  },
  amarelo: {
    zoeira: [
      'Amarelo. Nem lá, nem cá. Igual café morno.',
      'Dia amarelo. Dá pra esquentar isso amanhã.',
      'Meio termo hoje. Amanhã a gente tira o "meio".',
      'Amarelo é a cor do quase. Amanhã é a cor do pronto.',
      'Ficou no amarelo. Nada que uma lista nova não resolva.',
    ],
    neutro: [
      'Você está no caminho. Dá pra melhorar hoje.',
      'Bom esforço. Amanhã dá pra chegar mais perto dos 100%.',
      'Parte das tarefas ficou pendente. Amanhã é uma nova chance.',
      'Você fez uma boa parte da lista.',
      'Dia razoável. Vamos buscar mais amanhã.',
    ],
  },
  vermelho: {
    zoeira: [
      'Vermelho hoje. Amanhã é outra lista e outra chance.',
      'Dia difícil. Acontece. Amanhã a lista começa do zero.',
      'Hoje não rolou. Amanhã a revanche.',
      'Placar baixo hoje. O jogo de amanhã ainda tá 0 a 0.',
      'Dia vermelho. Respira, que amanhã tem mais.',
    ],
    neutro: [
      'Ainda há tarefas importantes pendentes.',
      'Hoje ficou abaixo do esperado. Amanhã é uma nova chance.',
      'Muitas tarefas ficaram pendentes hoje.',
      'Vamos recomeçar amanhã com tudo.',
      'Dia difícil. Amanhã a lista começa de novo.',
    ],
  },
  perto_fechamento: {
    zoeira: [
      'Faltam {minutos} min e {faltam} tarefas. Essa conta não fecha sozinha.',
      'Fecha em {minutos} minutos. Última chamada, tipo aeroporto.',
      '{minutos} minutos no relógio. Hora do modo turbo.',
      'Contagem regressiva: {minutos} min. A lista ainda tem {faltam}.',
      'O dia tá acabando e a lista não. Bora, {nome}.',
    ],
    neutro: [
      'Faltam {minutos} minutos para o fechamento.',
      'O dia fecha em {minutos} minutos. Ainda há {faltam} tarefas.',
      'Atenção: {minutos} minutos para fechar o dia.',
      'Restam {faltam} tarefas e {minutos} minutos.',
      'Últimos {minutos} minutos do dia.',
    ],
  },
  bonus_perto: {
    zoeira: [
      'Faltam {faltam}% pro bônus. Já dá pra sentir o cheiro do Pix.',
      '{faltam}% te separando do bônus. Tá logo ali.',
      'O bônus tá a {faltam}% de distância. Dá pra ver daqui.',
      'Mais {faltam}% e o bônus vem. Não para agora.',
      'Bônus à vista: faltam {faltam}%.',
    ],
    neutro: [
      'Faltam {faltam}% para o bônus.',
      'Você está a {faltam}% do bônus.',
      'Continue assim: faltam {faltam}% para o bônus.',
      'O bônus está perto: {faltam}%.',
      'Mais {faltam}% para alcançar o bônus.',
    ],
  },
  sequencia: {
    zoeira: [
      '{total} dias seguidos no 100%. Tá viciando, né?',
      '{total} dias de lista zerada. Isso já é estilo de vida.',
      'Sequência de {total} dias em 100%. Não quebra agora.',
      '{total} dias perfeitos seguidos. A lista já te respeita.',
      'Streak de {total} dias. Nem o despertador é tão pontual.',
    ],
    neutro: [
      '{total} dias seguidos com 100%!',
      'Sequência de {total} dias completos. Parabéns!',
      'Você completou tudo nos últimos {total} dias.',
      '{total} dias seguidos de lista completa.',
      'Ótima sequência: {total} dias em 100%.',
    ],
  },
  evolucao: {
    zoeira: [
      'Você tá {percentual}% melhor que o mês passado. Seu único concorrente é você.',
      '+{percentual}% em relação ao mês passado. O você de antes que lute.',
      'Subiu {percentual}% desde o mês passado. Evolução de personagem.',
      'Mês passado: bom. Este mês: {percentual}% melhor.',
      '{percentual}% acima do mês passado. Tá subindo de nível.',
    ],
    neutro: [
      'Você melhorou {percentual}% em relação ao mês passado.',
      'Seu desempenho está {percentual}% acima do mês passado.',
      'Evolução de {percentual}% em relação ao mês anterior.',
      'Parabéns: {percentual}% melhor que no mês passado.',
      'Você está {percentual}% à frente do mês passado.',
    ],
  },
  reprovada: { zoeira: REPROVADA, neutro: REPROVADA },
}

export function preencher(texto: string, v: Variaveis): string {
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (v[k as keyof Variaveis] !== undefined ? String(v[k as keyof Variaveis]) : m))
}

/**
 * Sorteia uma mensagem do momento, evitando repetir uma já usada no dia.
 * `usadas` é a lista de mensagens (texto-modelo) já mostradas hoje.
 */
export function sortearMensagem(momento: Momento, tom: Tom, usadas: string[] = [], aleatorio: () => number = Math.random): string {
  const opcoes = MENSAGENS[momento][tom]
  const livres = opcoes.filter((m) => !usadas.includes(m))
  const lista = livres.length ? livres : opcoes
  return lista[Math.floor(aleatorio() * lista.length)]
}

/* ---------------------------------------------------------------------- */
/* Qual momento mostrar no topo da tela Hoje                               */
/* ---------------------------------------------------------------------- */

export type Situacao = {
  total: number
  feitas: number
  reprovadas: { motivo: string }[]
  fechado: boolean
  minutosParaFechar: number
  sequencia: number // dias seguidos em 100% antes de hoje
  evolucao: number | null // pontos percentuais acima do mês passado (só se > 0)
  faltaBonus: number | null // pontos que faltam pro próximo nível (se visível)
}

export function escolherMomento(s: Situacao): Momento | null {
  if (s.total === 0) return null
  const pendentes = s.total - s.feitas
  if (s.reprovadas.length && !s.fechado) return 'reprovada'
  if (pendentes === 0) return 'dia_100'
  if (s.fechado) return s.feitas / s.total >= 0.5 ? 'amarelo' : 'vermelho'
  if (s.minutosParaFechar > 0 && s.minutosParaFechar <= 30) return 'perto_fechamento'
  if (pendentes === 1 && s.total > 1) return 'falta_uma'
  if (s.feitas > 0 && s.feitas >= s.total / 2 && s.feitas - 1 < s.total / 2) return 'metade'
  if (s.feitas === 1) return 'primeira_feita'
  if (s.feitas === 0) {
    if (s.sequencia >= 3) return 'sequencia'
    if (s.faltaBonus !== null && s.faltaBonus > 0 && s.faltaBonus <= 10) return 'bonus_perto'
    if (s.evolucao !== null && s.evolucao > 0) return 'evolucao'
    return 'abertura'
  }
  if (s.faltaBonus !== null && s.faltaBonus > 0 && s.faltaBonus <= 5) return 'bonus_perto'
  return s.feitas >= s.total / 2 ? 'reta_final' : 'andamento'
}

export function variaveisDa(s: Situacao, nome: string): Variaveis {
  const pendentes = s.total - s.feitas
  return {
    nome,
    total: s.sequencia >= 3 && s.feitas === 0 ? s.sequencia : s.total,
    faltam: s.faltaBonus !== null && s.feitas === 0 ? s.faltaBonus : pendentes,
    minutos: Math.max(0, s.minutosParaFechar),
    percentual: s.evolucao ?? 0,
    motivo: s.reprovadas[0]?.motivo ?? '',
  }
}
