// Rótulos de todas as opções fixas. O banco guarda o código (à esquerda);
// a tela mostra o rótulo. Mudar um rótulo aqui não exige migração.

export type Opcao = { valor: string; rotulo: string }

export const PERFIL: Opcao[] = [
  { valor: 'sozinho', rotulo: 'Sozinho na cadeira' },
  { valor: 'equipe', rotulo: 'Com equipe' },
]

export const DISPOSICAO: Opcao[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'organizar', rotulo: 'Sim, mas preciso me organizar' },
  { valor: 'entender', rotulo: 'Quero entender melhor' },
  { valor: 'nao', rotulo: 'Não no momento' },
]

export const FATURAMENTO: Opcao[] = [
  { valor: 'ate10', rotulo: 'Até R$ 10 mil' },
  { valor: '10a20', rotulo: 'R$ 10 a 20 mil' },
  { valor: '20a40', rotulo: 'R$ 20 a 40 mil' },
  { valor: '40a60', rotulo: 'R$ 40 a 60 mil' },
  { valor: '60mais', rotulo: 'Mais de R$ 60 mil' },
]

export const DOR: Opcao[] = [
  { valor: 'equipe', rotulo: 'Equipe' },
  { valor: 'rotina', rotulo: 'Rotina desorganizada' },
  { valor: 'numeros', rotulo: 'Números' },
  { valor: 'preco', rotulo: 'Preço' },
  { valor: 'agenda', rotulo: 'Agenda vazia' },
  { valor: 'clientes', rotulo: 'Clientes sumindo' },
  { valor: 'assinatura', rotulo: 'Assinatura' },
  { valor: 'tempo', rotulo: 'Falta de tempo' },
  { valor: 'outro', rotulo: 'Outro' },
]

export const ORIGEM: Opcao[] = [
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'indicacao', rotulo: 'Indicação' },
  { valor: 'mentorado', rotulo: 'Sou ou fui mentorado' },
  { valor: 'outro', rotulo: 'Outro' },
]

export const STATUS_LEAD: Opcao[] = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'contatado', rotulo: 'Contatado' },
  { valor: 'comprou', rotulo: 'Comprou' },
  { valor: 'descartado', rotulo: 'Descartado' },
]

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export function rotulo(lista: Opcao[], valor: string | null | undefined): string {
  if (!valor) return ''
  return lista.find((o) => o.valor === valor)?.rotulo ?? valor
}

export function valido(lista: Opcao[], valor: unknown): valor is string {
  return typeof valor === 'string' && lista.some((o) => o.valor === valor)
}
