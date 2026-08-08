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
  if (conta.tipo_acesso !== 'mensal') {
    return {
      liberado: true, estado: 'vitalicio', diasParaVencer: null,
      diasDeCarencia: null, validoAte: null, cancelada: false, atrasada: false,
    }
  }

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
      liberado: true, estado: 'revisar', diasParaVencer: null,
      diasDeCarencia: null, validoAte: null, cancelada, atrasada,
    }
  }

  const dias = diasEntre(agora, validoAte)

  // Ainda no prazo pago. Cancelada NÃO corta aqui de propósito: quem cancelou
  // já pagou o período corrente, e tirar o acesso antes do fim seria cobrar
  // sem entregar. O que o cancelamento faz é não renovar depois.
  if (dias > DIAS_AVISO) {
    return {
      liberado: true, estado: 'ok', diasParaVencer: dias,
      diasDeCarencia: null, validoAte, cancelada, atrasada,
    }
  }

  if (dias >= 0) {
    return {
      liberado: true, estado: 'avisar', diasParaVencer: dias,
      diasDeCarencia: null, validoAte, cancelada, atrasada,
    }
  }

  const diasVencidos = -dias
  if (diasVencidos <= DIAS_CARENCIA) {
    return {
      liberado: true, estado: 'carencia', diasParaVencer: dias,
      diasDeCarencia: DIAS_CARENCIA - diasVencidos, validoAte, cancelada, atrasada,
    }
  }

  return {
    liberado: false, estado: 'bloqueado', diasParaVencer: dias,
    diasDeCarencia: 0, validoAte, cancelada, atrasada,
  }
}

/** Frase curta pro banner, escolhida pelo estado. */
export function mensagemAcesso(a: Avaliacao): string | null {
  switch (a.estado) {
    case 'avisar':
      return a.diasParaVencer === 0
        ? 'Sua assinatura vence hoje.'
        : `Sua assinatura vence em ${a.diasParaVencer} ${a.diasParaVencer === 1 ? 'dia' : 'dias'}.`
    case 'carencia':
      return a.diasDeCarencia === 0
        ? 'Sua assinatura venceu. Hoje é o último dia de acesso.'
        : `Sua assinatura venceu. Você ainda tem ${a.diasDeCarencia} ${a.diasDeCarencia === 1 ? 'dia' : 'dias'} de acesso.`
    case 'revisar':
      return 'Estamos confirmando os dados da sua assinatura. O acesso segue liberado.'
    default:
      return null
  }
}
