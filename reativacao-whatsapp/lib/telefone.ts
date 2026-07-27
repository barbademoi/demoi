export interface TelefoneNormalizado {
  numero: string // só dígitos, com código do país: 55DDDNNNNNNNNN
  valido: boolean
}

/**
 * Normaliza um telefone brasileiro (em qualquer formato comum de planilha)
 * pro padrão internacional usado no link do WhatsApp: 55 + DDD (2) + número (9).
 */
export function normalizarTelefone(bruto: unknown): TelefoneNormalizado {
  if (bruto == null) return { numero: '', valido: false }

  let digitos = String(bruto).replace(/\D/g, '')
  if (!digitos) return { numero: '', valido: false }

  // "0055..." -> remove o 00 de discagem internacional
  if (digitos.startsWith('0055') && digitos.length > 12) {
    digitos = digitos.slice(2)
  }

  // Já vem com código do país (55 + 10 ou 11 dígitos)
  let semPais: string
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    semPais = digitos.slice(2)
  } else {
    semPais = digitos
  }

  // Remove zero de discagem local (0 DDD número), se sobrou
  if (semPais.startsWith('0') && (semPais.length === 11 || semPais.length === 12)) {
    semPais = semPais.slice(1)
  }

  // DDD + número sem o 9º dígito do celular (10 dígitos) -> completa com 9
  if (semPais.length === 10) {
    const ddd = semPais.slice(0, 2)
    let numero = semPais.slice(2)
    if (/^[6-9]/.test(numero)) numero = '9' + numero
    semPais = ddd + numero
  }

  if (semPais.length !== 11) {
    return { numero: digitos, valido: false }
  }

  const ddd = Number(semPais.slice(0, 2))
  if (ddd < 11 || ddd > 99) {
    return { numero: digitos, valido: false }
  }

  return { numero: `55${semPais}`, valido: true }
}

/** Monta o link wa.me com a mensagem já preenchida. */
export function linkWhatsapp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

/** Telefone formatado pra exibição: (11) 91234-5678 */
export function formatarTelefoneBR(numeroComPais: string): string {
  const semPais = numeroComPais.startsWith('55') ? numeroComPais.slice(2) : numeroComPais
  if (semPais.length !== 11) return numeroComPais
  const ddd = semPais.slice(0, 2)
  const parte1 = semPais.slice(2, 7)
  const parte2 = semPais.slice(7)
  return `(${ddd}) ${parte1}-${parte2}`
}
