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
  /** Não casa pelo nome, mas o dono já confirmou o de-para. Também importa. */
  | 'confirmado'
  /** O dono disse que este nome não corresponde a ninguém. Silêncio. */
  | 'ignorado'
  /** O nome existe no BarberMeta, mas o barbeiro está desativado. */
  | 'inativo'
  /** O nome bate com alguém que foi excluído de vez. */
  | 'excluido'
  /** Ninguém com esse nome. Vira pendência pro dono confirmar uma vez. */
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
export interface DeParaConfirmado {
  /** Nome do Agenda, já normalizado. */
  nomeOrigem: string
  /** null quando a linha é um "ignorar sempre". */
  barbeiroId: string | null
  ignorar: boolean
}

export function conciliar(
  nomesDoRelatorio: string[],
  barbeiros: BarbeiroDoBanco[],
  nomesExcluidos: string[] = [],
  depara: DeParaConfirmado[] = [],
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

  const porId = new Map((barbeiros ?? []).map((b) => [b.id, b]))
  const confirmados = new Map((depara ?? []).map((d) => [normalizarNome(d.nomeOrigem), d]))

  return (nomesDoRelatorio ?? []).map((nomeRelatorio) => {
    const chave = normalizarNome(nomeRelatorio)

    // O DE-PARA VEM PRIMEIRO. Ele é uma decisão explícita do dono; o
    // casamento por nome é um palpite. Quando os dois discordam, quem manda é
    // quem foi confirmado à mão.
    const conf = confirmados.get(chave)
    if (conf?.ignorar) {
      return { nomeRelatorio, situacao: 'ignorado' as const }
    }
    if (conf?.barbeiroId) {
      const alvo = porId.get(conf.barbeiroId)
      // O barbeiro confirmado pode ter sido desativado depois. Aí o de-para
      // não vale mais sozinho: cai na mesma explicação de qualquer inativo.
      if (alvo?.ativo) {
        return { nomeRelatorio, situacao: 'confirmado' as const, barbeiroId: alvo.id, nomeCadastrado: alvo.nome }
      }
      if (alvo) {
        return { nomeRelatorio, situacao: 'inativo' as const, nomeCadastrado: alvo.nome }
      }
    }

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
  /** Nomes novos, esperando o dono confirmar o de-para uma vez. */
  pendentes: string[]
  /** O dono já disse que não correspondem a ninguém — não viram recado. */
  ignorados: string[]
  /** Casaram, mas a gravação falhou. Isso é erro de sistema, não de cadastro. */
  falharam: string[]
}

export function resumir(linhas: LinhaConciliada[], importados: string[], falharam: string[]): ResumoImport {
  const por = (s: Situacao) => (linhas ?? []).filter((l) => l.situacao === s).map((l) => l.nomeRelatorio)
  return {
    importados: importados ?? [],
    inativos: por('inativo'),
    excluidos: por('excluido'),
    pendentes: por('desconhecido'),
    ignorados: por('ignorado'),
    falharam: falharam ?? [],
  }
}

/** Os nomes que o endpoint precisa registrar como pendência pra tela listar. */
export function nomesParaRegistrarPendencia(linhas: LinhaConciliada[]): string[] {
  return (linhas ?? []).filter((l) => l.situacao === 'desconhecido').map((l) => l.nomeRelatorio)
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

  if (r.pendentes.length > 0) {
    // Não manda mais "ajuste o nome": renomear o barbeiro pra agradar um
    // relatório externo mudaria o nome que aparece no ranking e no card de
    // pagamento dele. Confirmar o de-para resolve sem mexer em nada disso.
    out.push(`○ Falta confirmar o de-para de: ${lista(r.pendentes)}. Abra "Importar relatório" no BarberMeta e confirme esse nome uma vez — depois disso ele entra sozinho em toda importação.`)
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
