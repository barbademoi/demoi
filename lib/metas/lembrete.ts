// LEMBRETE DE CADASTRAR A META DO MÊS.
//
// A regra aqui responde uma pergunta só: o ciclo vigente já tem meta? Ela
// precisa estar certa nos dois sentidos. Um falso "não tem" incomoda o dono
// com um popup depois de ele já ter cadastrado, e ele para de confiar no
// aviso. Um falso "tem" deixa o mês inteiro correr sem meta, que é o problema
// que o lembrete existe pra evitar.

export interface MetaDoCiclo {
  meta_coletiva: number | string | null
  meta_coletiva_bronze?: number | string | null
  meta_coletiva_prata?: number | string | null
}

export interface MetaIndividualSimples {
  bronze_comm?: number | string | null
  prata_comm?: number | string | null
  ouro_comm?: number | string | null
}

const num = (v: unknown) => Number(v) || 0

/**
 * A meta do ciclo está cadastrada?
 *
 * A LINHA EXISTIR NÃO BASTA. `metas` ganha registro por caminhos que não são o
 * dono definindo a meta do mês — o lançamento de acumulado e o import da
 * agenda escrevem `faturamento_acumulado` e `numero_atendimentos` nela. Uma
 * linha com faturamento e meta zerada é exatamente o caso que o lembrete
 * precisa pegar: a barbearia está faturando e ninguém disse aonde quer chegar.
 *
 * Conta como cadastrada se houver QUALQUER alvo definido — coletivo em
 * qualquer tier, ou individual de qualquer barbeiro. Uma barbearia que só usa
 * meta individual não pode ser cobrada por não ter meta coletiva.
 */
export function metaEstaCadastrada(
  meta: MetaDoCiclo | null | undefined,
  individuais: MetaIndividualSimples[] | null | undefined,
): boolean {
  if (meta) {
    if (num(meta.meta_coletiva) > 0) return true
    if (num(meta.meta_coletiva_bronze) > 0) return true
    if (num(meta.meta_coletiva_prata) > 0) return true
  }
  return (individuais ?? []).some(
    (m) => num(m.bronze_comm) > 0 || num(m.prata_comm) > 0 || num(m.ouro_comm) > 0,
  )
}

export interface ContextoLembrete {
  /** Já existe alvo definido pro ciclo vigente. */
  metaCadastrada: boolean
  /** Barbeiros ativos na barbearia. Sem equipe não há meta a cadastrar. */
  barbeirosAtivos: number
  /** Modo do ciclo vigente: 'pontos' não trabalha com meta de faturamento. */
  modoDoCiclo: string
  /** Ciclo vigente fechado — não há mais o que planejar nele. */
  cicloFechado: boolean
  /** Até quando o dono adiou o lembrete deste ciclo. */
  adiadoAte: Date | null
  agora: Date
}

export type MotivoOculto =
  | 'ja-cadastrada'
  | 'sem-equipe'
  | 'modo-pontos'
  | 'ciclo-fechado'
  | 'adiado'

/**
 * O lembrete deve aparecer?
 *
 * Devolve o MOTIVO quando não — os motivos não são intercambiáveis na hora de
 * entender por que o dono não viu o aviso, e um booleano solto apagaria isso.
 *
 * A ordem importa: 'ja-cadastrada' vem primeiro porque é a única condição
 * que significa "está tudo certo"; as outras são "não é hora de perguntar".
 */
export function decidirLembreteMeta(ctx: ContextoLembrete): { mostrar: true } | { mostrar: false; motivo: MotivoOculto } {
  if (ctx.metaCadastrada) return { mostrar: false, motivo: 'ja-cadastrada' }
  if ((ctx.barbeirosAtivos ?? 0) <= 0) return { mostrar: false, motivo: 'sem-equipe' }
  if (ctx.modoDoCiclo === 'pontos') return { mostrar: false, motivo: 'modo-pontos' }
  if (ctx.cicloFechado) return { mostrar: false, motivo: 'ciclo-fechado' }
  if (ctx.adiadoAte && ctx.adiadoAte.getTime() > ctx.agora.getTime()) {
    return { mostrar: false, motivo: 'adiado' }
  }
  return { mostrar: true }
}

/**
 * Quantos dias do ciclo já passaram, e o tom que isso pede.
 *
 * Um ciclo que mal começou pede convite; um que já vai pela metade pede um
 * aviso de que está passando. O texto muda porque a urgência mudou de
 * verdade — não para pressionar.
 */
export type Urgencia = 'inicio' | 'andando' | 'tarde'

export function urgenciaDoCiclo(diasDecorridos: number, totalDias: number): Urgencia {
  if (totalDias <= 0) return 'inicio'
  const fracao = Math.max(0, diasDecorridos) / totalDias
  if (fracao <= 0.2) return 'inicio'
  if (fracao <= 0.6) return 'andando'
  return 'tarde'
}

export interface TextoLembrete {
  titulo: string
  corpo: string
}

export function textoLembrete(urgencia: Urgencia, cicloLabel: string, diasRestantes: number): TextoLembrete {
  const restam = diasRestantes === 1 ? 'resta 1 dia' : `restam ${diasRestantes} dias`

  if (urgencia === 'inicio') {
    return {
      titulo: `Cadastre a meta de ${cicloLabel}`,
      corpo: 'O ciclo está começando — é a melhor hora. Barbeiro que sabe onde precisa chegar se movimenta desde o primeiro dia.',
    }
  }
  if (urgencia === 'andando') {
    return {
      titulo: `${cicloLabel} ainda está sem meta`,
      corpo: `O ciclo já está correndo e ${restam}. Sem meta cadastrada, o time não tem alvo e o ranking não tem prêmio.`,
    }
  }
  return {
    titulo: `${cicloLabel} está acabando sem meta`,
    corpo: `${restam.charAt(0).toUpperCase()}${restam.slice(1)} de ciclo. Dá tempo de cadastrar e fechar o mês com o time sabendo onde chegar.`,
  }
}
