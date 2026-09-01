// Regras da IMPORTAÇÃO de comissões do BarberMeta para o Financeiro.
//
// O import copia `lancamentos.comissao_acumulada` de um ciclo para o cadastro
// de colaboradores. Antes ele gravava direto, no mês corrente e sem perguntar.
// Agora o mês é escolhido e, quando o destino já tem valor, o dono vê o que
// vai mudar antes de decidir.
//
// A comparação fica aqui, fora do componente, porque é a parte que decide se
// um número lançado à mão vai ser substituído — e isso precisa ser
// exercitável sem navegador.

/** O que o BarberMeta tem para um barbeiro no ciclo pedido. */
export interface ComissaoImportada {
  id: string
  nome: string
  comissao: number
}

/**
 * O que acontece com cada barbeiro se a importação for confirmada.
 *
 *   novo         — não há colaborador correspondente; será criado
 *   igual        — o valor já é esse; nada muda
 *   preenche     — o mês está vazio no Financeiro e vai receber o valor
 *   sobrescreve  — já existe outro valor no mês; será substituído
 *   zera         — o BarberMeta não tem valor no ciclo e o Financeiro tem
 *
 * `zera` é separado de `sobrescreve` de propósito: é o caso em que importar
 * APAGA um número sem colocar outro no lugar. Num mês que "ficou sem dado" no
 * BarberMeta, importar sem ver isso destruiria justamente o que foi digitado
 * à mão para tapar o buraco.
 */
export type EfeitoImport = 'novo' | 'igual' | 'preenche' | 'sobrescreve' | 'zera'

export interface LinhaPrevia {
  barbeiroId: string
  nome: string
  /** O que está hoje no Financeiro para o mês. null = nem colaborador existe. */
  atual: number | null
  /** O que o BarberMeta tem no ciclo. */
  novo: number
  efeito: EfeitoImport
}

export interface PreviaImport {
  linhas: LinhaPrevia[]
  /** Linhas que mudam alguma coisa — as outras são ruído na hora de decidir. */
  mudam: LinhaPrevia[]
  /** Linhas que apagam ou trocam um valor já existente. Só elas pedem confirmação. */
  conflitos: LinhaPrevia[]
  /** true quando dá pra aplicar direto, sem nada a confirmar. */
  semConflito: boolean
}

const norm = (s: string) => String(s ?? '').trim().toLowerCase()

/** Acha o colaborador que corresponde a um barbeiro: por id, e por nome como reserva. */
export function acharColaborador<T extends { scope?: string; type?: string; barbeiroId?: string; name?: string }>(
  colaboradores: T[],
  barbeiro: { id: string; nome: string },
): T | undefined {
  const lista = colaboradores ?? []
  return (
    lista.find((c) => c.scope === 'empresa' && c.barbeiroId === barbeiro.id) ??
    lista.find((c) => c.scope === 'empresa' && c.type === 'comissao' && norm(c.name ?? '') === norm(barbeiro.nome))
  )
}

/**
 * Monta o "antes e depois" da importação, sem alterar nada.
 *
 * `valorAtual` lê o bruto do colaborador no mês — é passado de fora pra usar
 * exatamente a mesma régua da tela.
 */
export function montarPreviaImport<T extends { scope?: string; type?: string; barbeiroId?: string; name?: string }>(
  colaboradores: T[],
  barbeiros: ComissaoImportada[],
  ym: string,
  valorAtual: (c: T, ym: string) => number,
): PreviaImport {
  const linhas: LinhaPrevia[] = (barbeiros ?? []).map((b) => {
    const c = acharColaborador(colaboradores, b)
    const atual = c ? valorAtual(c, ym) : null
    const novo = Number(b.comissao) || 0

    let efeito: EfeitoImport
    if (!c) efeito = 'novo'
    else if ((atual ?? 0) === novo) efeito = 'igual'
    else if ((atual ?? 0) === 0) efeito = 'preenche'
    else if (novo === 0) efeito = 'zera'
    else efeito = 'sobrescreve'

    return { barbeiroId: b.id, nome: b.nome, atual, novo, efeito }
  })

  const mudam = linhas.filter((l) => l.efeito !== 'igual')
  const conflitos = linhas.filter((l) => l.efeito === 'sobrescreve' || l.efeito === 'zera')

  return { linhas, mudam, conflitos, semConflito: conflitos.length === 0 }
}

/**
 * Aplica a importação sobre a lista de colaboradores.
 *
 * `manterConflitos` protege os valores que já existiam: com ele, quem estava
 * marcado como `sobrescreve` ou `zera` fica como está, e o resto entra. É o
 * "importar só o que falta" da tela.
 */
export function aplicarImport<T extends { scope?: string; type?: string; barbeiroId?: string; name?: string; monthly?: Record<string, number> }>(
  colaboradores: T[],
  previa: PreviaImport,
  barbeiros: ComissaoImportada[],
  ym: string,
  criar: (b: ComissaoImportada, ym: string) => T,
  opcoes?: { manterConflitos?: boolean },
): { lista: T[]; criados: number; atualizados: number; mantidos: number } {
  const manter = opcoes?.manterConflitos === true
  const porBarbeiro = new Map(previa.linhas.map((l) => [l.barbeiroId, l]))
  const lista = [...(colaboradores ?? [])]
  let criados = 0
  let atualizados = 0
  let mantidos = 0

  for (const b of barbeiros ?? []) {
    const linha = porBarbeiro.get(b.id)
    if (!linha) continue

    if (manter && (linha.efeito === 'sobrescreve' || linha.efeito === 'zera')) {
      mantidos++
      continue
    }

    const existente = acharColaborador(lista, b)
    if (!existente) {
      lista.push(criar(b, ym))
      criados++
      continue
    }

    const idx = lista.indexOf(existente)
    // O barbeiroId é carimbado junto: é ele que liga o colaborador ao barbeiro
    // daqui pra frente, inclusive quando alguém corrigir a grafia do nome.
    lista[idx] = {
      ...existente,
      barbeiroId: b.id,
      monthly: { ...(existente.monthly || {}), [ym]: linha.novo },
    }
    if (linha.efeito !== 'igual') atualizados++
  }

  return { lista, criados, atualizados, mantidos }
}
