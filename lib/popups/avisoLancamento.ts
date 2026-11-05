/**
 * "JÁ VI O AVISO HOJE?" — a conta do dia, separada da tela.
 *
 * O aviso de lançamento aparece UMA vez por dia, no primeiro acesso do dia, e
 * por usuário. Três decisões que valem explicação:
 *
 * ── O DIA É O DE SÃO PAULO, NUNCA O UTC ─────────────────────────────────────
 * Em UTC o dia vira às 21h de Brasília. Uma barbearia que fecha às 20h e o
 * dono que lança às 22h veriam o aviso DUAS vezes na mesma noite de trabalho —
 * a segunda já contando como "amanhã". O ciclo, a projeção e o lançamento
 * diário todos usam America/Sao_Paulo; o aviso usa o mesmo relógio.
 *
 * ── STORAGE QUE FALHA MOSTRA O AVISO ────────────────────────────────────────
 * Navegação privada, cookies bloqueados, iOS com storage cheio: `localStorage`
 * pode lançar exceção tanto na leitura quanto na escrita. Nesse caso o aviso
 * APARECE. Entre repetir um lembrete e esconder de quem nunca viu, repetir é o
 * erro barato — e esta é a tela que ensina a usar o sistema.
 *
 * ── A CHAVE TEM O DIA DENTRO ────────────────────────────────────────────────
 * `barbermeta_aviso_lancamento_<userId>_<AAAA-MM-DD>`. Guardar a data DENTRO
 * da chave, em vez de um valor com a data, faz a virada do dia ser automática:
 * amanhã a chave simplesmente não existe. O preço é uma chave por dia, então a
 * escrita limpa as dos dias anteriores do mesmo usuário.
 */

export const PREFIXO_CHAVE = 'barbermeta_aviso_lancamento_'

/** Interface mínima do localStorage — permite testar o caso que explode. */
export interface StorageLike {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
  readonly length: number
  key(i: number): string | null
}

/** 'AAAA-MM-DD' no fuso de São Paulo. en-CA é o locale que já sai nessa ordem. */
export function diaSaoPaulo(agora: Date = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function chaveDoDia(userId: string, dia: string): string {
  return `${PREFIXO_CHAVE}${userId}_${dia}`
}

/**
 * Já viu o aviso hoje?
 *
 * Sem storage, ou com storage que lança, a resposta é NÃO — o aviso aparece.
 */
export function jaVistoHoje(
  storage: StorageLike | null | undefined,
  userId: string,
  agora: Date = new Date(),
): boolean {
  if (!storage || !userId) return false
  try {
    return storage.getItem(chaveDoDia(userId, diaSaoPaulo(agora))) !== null
  } catch {
    return false
  }
}

/**
 * Marca como visto hoje e limpa os dias anteriores do mesmo usuário.
 *
 * Nunca lança: chamada no meio do fluxo de abrir o popup, e uma exceção aqui
 * deixaria a tela sem o modal e com um erro no console. Devolve se conseguiu
 * gravar, só para quem quiser registrar.
 */
export function marcarVistoHoje(
  storage: StorageLike | null | undefined,
  userId: string,
  agora: Date = new Date(),
): boolean {
  if (!storage || !userId) return false
  const chave = chaveDoDia(userId, diaSaoPaulo(agora))
  try {
    storage.setItem(chave, '1')
  } catch {
    return false
  }
  // Faxina das chaves antigas deste usuário. Separada do try acima de
  // propósito: se a limpeza falhar, o aviso já está marcado e isso é o que
  // importa.
  try {
    const doUsuario = `${PREFIXO_CHAVE}${userId}_`
    const velhas: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k && k !== chave && k.startsWith(doUsuario)) velhas.push(k)
    }
    for (const k of velhas) storage.removeItem(k)
  } catch {
    // Chave a mais no storage não quebra nada.
  }
  return true
}
