// CONCILIAÇÃO DE NOMES do relatório do Agenda Serviço com os barbeiros do
// BarberMeta.
//
// A importação nunca falhou por causa de um nome sem correspondência — ela já
// pulava e seguia. O que falhava era a EXPLICAÇÃO: todo mundo que não casava
// caía num balaio único com a frase "confira o nome no BarberMeta", inclusive
// quem tinha o nome certíssimo e só estava desativado. Procurar erro de
// digitação num nome que está correto é o tipo de caça que não termina.
//
// Aqui cada nome é classificado no que ele realmente é, porque a ação do dono
// muda em cada caso: renomear, reativar, ou nada.

export type Situacao =
  /** Casou com um barbeiro ativo — vai ser importado. */
  | 'ativo'
  /** O nome existe no BarberMeta, mas o barbeiro está desativado. */
  | 'inativo'
  /** O nome bate com alguém que foi excluído de vez. */
  | 'excluido'
  /** Ninguém com esse nome, nem ativo, nem inativo, nem excluído. */
  | 'desconhecido'

export interface BarbeiroDoBanco {
  id: string
  nome: string
  ativo: boolean
}

export interface LinhaConciliada {
  /** Nome como veio do relatório, preservado para a mensagem. */
  nomeRelatorio: string
  situacao: Situacao
  /** Só quando a situação é 'ativo'. */
  barbeiroId?: string
  /** O nome como está cadastrado, quando encontrado. */
  nomeCadastrado?: string
}

/**
 * Nomes comparáveis: sem acento, sem caixa, sem espaço repetido.
 *
 * É a mesma normalização que o extrator aplica do outro lado. As duas
 * precisam concordar — se uma tirar acento e a outra não, "Joao" e "João"
 * viram pessoas diferentes e o dono nunca entende por quê.
 */
export function normalizarNome(n: string): string {
  return String(n ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Classifica cada nome do relatório.
 *
 * `barbeiros` vem SEM filtro de ativo, de propósito: é o que permite dizer
 * "está desativado" em vez de "não existe". `nomesExcluidos` vem do rastro de
 * exclusões (migration 057), que é a única memória que sobra de quem foi
 * apagado.
 */
export function conciliar(
  nomesDoRelatorio: string[],
  barbeiros: BarbeiroDoBanco[],
  nomesExcluidos: string[] = [],
): LinhaConciliada[] {
  const porNome = new Map<string, BarbeiroDoBanco>()
  // Ativo tem precedência: se existir um ativo e um inativo com o mesmo nome
  // (acontece quando alguém é recadastrado em vez de reativado), o import tem
  // que ir para o que está em uso.
  for (const b of barbeiros ?? []) {
    const chave = normalizarNome(b.nome)
    const atual = porNome.get(chave)
    if (!atual || (!atual.ativo && b.ativo)) porNome.set(chave, b)
  }
  const excluidos = new Set((nomesExcluidos ?? []).map(normalizarNome))

  return (nomesDoRelatorio ?? []).map((nomeRelatorio) => {
    const chave = normalizarNome(nomeRelatorio)
    const achado = porNome.get(chave)

    if (achado?.ativo) {
      return { nomeRelatorio, situacao: 'ativo' as const, barbeiroId: achado.id, nomeCadastrado: achado.nome }
    }
    if (achado) {
      return { nomeRelatorio, situacao: 'inativo' as const, nomeCadastrado: achado.nome }
    }
    if (excluidos.has(chave)) {
      return { nomeRelatorio, situacao: 'excluido' as const }
    }
    return { nomeRelatorio, situacao: 'desconhecido' as const }
  })
}

export interface ResumoImport {
  importados: string[]
  inativos: string[]
  excluidos: string[]
  desconhecidos: string[]
  /** Casaram, mas a gravação falhou. Isso é erro de sistema, não de cadastro. */
  falharam: string[]
}

export function resumir(linhas: LinhaConciliada[], importados: string[], falharam: string[]): ResumoImport {
  const por = (s: Situacao) => (linhas ?? []).filter((l) => l.situacao === s).map((l) => l.nomeRelatorio)
  return {
    importados: importados ?? [],
    inativos: por('inativo'),
    excluidos: por('excluido'),
    desconhecidos: por('desconhecido'),
    falharam: falharam ?? [],
  }
}

const lista = (ns: string[]) => ns.join(', ')
const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos)

/**
 * As frases que a extensão mostra.
 *
 * Cada situação vira uma frase com a AÇÃO correspondente, porque "confira o
 * nome" só faz sentido para um caso dos três. Um nome desativado pede
 * reativar; um excluído não pede nada.
 */
export function mensagensDoResumo(r: ResumoImport): string[] {
  const out: string[] = []

  if (r.importados.length > 0) {
    out.push(`✓ ${r.importados.length} ${plural(r.importados.length, 'barbeiro atualizado', 'barbeiros atualizados')}: ${lista(r.importados)}`)
  }

  if (r.falharam.length > 0) {
    out.push(`✗ ${r.falharam.length} ${plural(r.falharam.length, 'falhou', 'falharam')} ao gravar: ${lista(r.falharam)}. Tente de novo; se persistir, avise o suporte.`)
  }

  if (r.inativos.length > 0) {
    out.push(`○ Ignorado por estar DESATIVADO no BarberMeta: ${lista(r.inativos)}. O nome está certo — reative em Configurações → Equipe se ele ainda trabalha aí.`)
  }

  if (r.excluidos.length > 0) {
    out.push(`○ Ignorado por ter sido EXCLUÍDO do BarberMeta: ${lista(r.excluidos)}. Se voltou a trabalhar, cadastre de novo.`)
  }

  if (r.desconhecidos.length > 0) {
    out.push(`○ Sem cadastro no BarberMeta: ${lista(r.desconhecidos)}. Cadastre em Configurações → Equipe, ou ajuste o nome pra ficar igual ao do Agenda Serviço.`)
  }

  // O caso que mais confundia: 200 com zero importados parecia sucesso.
  if (r.importados.length === 0 && r.falharam.length === 0) {
    out.unshift('Nenhum barbeiro foi importado — nenhum nome do relatório casou com a sua equipe no BarberMeta.')
  }

  return out
}

/** true quando nada foi gravado por FALHA DE ESCRITA (e não por de-para). */
export function tudoFalhouAoGravar(r: ResumoImport): boolean {
  return r.importados.length === 0 && r.falharam.length > 0
}
