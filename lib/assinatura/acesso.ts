/**
 * QUEM PODE ENTRAR — lógica pura, sem I/O.
 *
 * REGRA DE OURO: `vitalicio` sai desta função na primeira linha. Ele nunca é
 * comparado com data nenhuma, nunca entra em carência, nunca vê aviso. Os ~600
 * clientes que compraram acesso permanente não podem ser afetados por nada que
 * se escreva aqui embaixo.
 */

export const DIAS_AVISO = 3     // avisa 3 dias antes de vencer
export const DIAS_CARENCIA = 3  // depois de vencer, ainda entra por 3 dias

/**
 * TIPOS REGIDOS POR VALIDADE.
 *
 * A conferência era `tipo_acesso !== 'mensal'` → vitalício. Com a chegada do
 * acesso anual isso viraria um buraco silencioso: `anual` não é 'mensal',
 * então cairia no ramo do vitalício e NUNCA bloquearia — o cliente teria
 * acesso para sempre por R$ 97.
 *
 * A lista é explícita pra que adicionar um tipo novo obrigue a decidir de que
 * lado ele fica, em vez de herdar o lado errado por omissão.
 *
 * Quem NÃO está aqui é liberado sem checagem — inclusive `null` e valores
 * desconhecidos. Isso é deliberado: diante de um dado que não entendemos, o
 * erro barato é deixar o cliente trabalhar.
 */
export const TIPOS_COM_VALIDADE: ReadonlySet<string> = new Set(['mensal', 'anual'])

export type EstadoAcesso =
  | 'vitalicio'   // permanente — nada a checar
  | 'ok'          // assinatura em dia
  | 'revisar'     // assinatura sem validade definida (falha nossa) — libera e sinaliza
  | 'avisar'      // vence em até 3 dias
  | 'carencia'    // venceu, mas ainda dentro dos 3 dias de tolerância
  | 'bloqueado'   // venceu e a carência acabou

export interface ContaAcesso {
  tipo_acesso: string | null
  status_assinatura: string | null
  valido_ate: string | Date | null
}

export interface Avaliacao {
  liberado: boolean
  estado: EstadoAcesso
  /** Tipo lido da conta — a tela de bloqueio usa pra escolher o texto e o CTA. */
  tipo: 'vitalicio' | 'mensal' | 'anual'
  /** Dias até vencer (negativo = já venceu). null quando não se aplica. */
  diasParaVencer: number | null
  /** Dias que ainda restam de carência depois de vencido. */
  diasDeCarencia: number | null
  validoAte: Date | null
  cancelada: boolean
  atrasada: boolean
}

const DIA_MS = 24 * 60 * 60 * 1000

/** Diferença em dias inteiros, contando pelo DIA no fuso de São Paulo. */
function diasEntre(de: Date, ate: Date): number {
  const d1 = new Date(de.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const d2 = new Date(ate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  return Math.round((d2.getTime() - d1.getTime()) / DIA_MS)
}

export function avaliarAcesso(conta: ContaAcesso, agora: Date = new Date()): Avaliacao {
  // ── VITALÍCIO SAI AQUI. Não olha status, não olha data. ──────────────────
  if (!TIPOS_COM_VALIDADE.has(conta.tipo_acesso ?? '')) {
    return {
      liberado: true, estado: 'vitalicio', tipo: 'vitalicio', diasParaVencer: null,
      diasDeCarencia: null, validoAte: null, cancelada: false, atrasada: false,
    }
  }

  const tipo = conta.tipo_acesso === 'anual' ? 'anual' as const : 'mensal' as const

  const cancelada = conta.status_assinatura === 'cancelada'
  const atrasada  = conta.status_assinatura === 'atrasada'

  const validoAte = conta.valido_ate
    ? (conta.valido_ate instanceof Date ? conta.valido_ate : new Date(conta.valido_ate))
    : null

  // Assinante sem data de validade é falha NOSSA de dado, não inadimplência.
  // Barrar quem pagou por causa de um buraco no nosso registro é o pior dos
  // erros possíveis aqui — libera e marca pra revisão no painel.
  if (!validoAte || isNaN(validoAte.getTime())) {
    return {
      liberado: true, estado: 'revisar', tipo, diasParaVencer: null,
      diasDeCarencia: null, validoAte: null, cancelada, atrasada,
    }
  }

  const dias = diasEntre(agora, validoAte)

  // Ainda no prazo pago. Cancelada NÃO corta aqui de propósito: quem cancelou
  // já pagou o período corrente, e tirar o acesso antes do fim seria cobrar
  // sem entregar. O que o cancelamento faz é não renovar depois.
  if (dias > DIAS_AVISO) {
    return {
      liberado: true, estado: 'ok', tipo, diasParaVencer: dias,
      diasDeCarencia: null, validoAte, cancelada, atrasada,
    }
  }

  if (dias >= 0) {
    return {
      liberado: true, estado: 'avisar', tipo, diasParaVencer: dias,
      diasDeCarencia: null, validoAte, cancelada, atrasada,
    }
  }

  const diasVencidos = -dias
  if (diasVencidos <= DIAS_CARENCIA) {
    return {
      liberado: true, estado: 'carencia', tipo, diasParaVencer: dias,
      diasDeCarencia: DIAS_CARENCIA - diasVencidos, validoAte, cancelada, atrasada,
    }
  }

  return {
    liberado: false, estado: 'bloqueado', tipo, diasParaVencer: dias,
    diasDeCarencia: 0, validoAte, cancelada, atrasada,
  }
}

/**
 * Frase curta pro banner, escolhida pelo estado.
 *
 * O sujeito muda com o tipo: quem comprou 1 ano não tem "assinatura" e não vai
 * entender um aviso pedindo pra regularizar pagamento — o que ele precisa
 * fazer é comprar de novo.
 */
export function mensagemAcesso(a: Avaliacao): string | null {
  const sujeito = a.tipo === 'anual' ? 'Seu acesso anual' : 'Sua assinatura'
  const dias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`

  switch (a.estado) {
    case 'avisar':
      return a.diasParaVencer === 0
        ? `${sujeito} vence hoje.`
        : `${sujeito} vence em ${dias(a.diasParaVencer!)}.`
    case 'carencia':
      return a.diasDeCarencia === 0
        ? `${sujeito} venceu. Hoje é o último dia de acesso.`
        : `${sujeito} venceu. Você ainda tem ${dias(a.diasDeCarencia!)} de acesso.`
    case 'revisar':
      return a.tipo === 'anual'
        ? 'Estamos confirmando os dados da sua compra. O acesso segue liberado.'
        : 'Estamos confirmando os dados da sua assinatura. O acesso segue liberado.'
    default:
      return null
  }
}
