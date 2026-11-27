/**
 * Pix "copia e cola" (BR Code estático) com valor, gerado a partir da chave.
 * Padrão EMV do Banco Central: campos ID+tamanho+valor e CRC16 no final.
 */
function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, '0') + valor
}

function semAcento(s: string, max: number) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, max)
}

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Normaliza telefone para +55..., deixa CPF/CNPJ/e-mail/aleatória como estão. */
export function normalizarChave(chave: string): string {
  const c = chave.trim()
  if (c.includes('@')) return c.toLowerCase()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return c.toLowerCase()
  if (c.startsWith('+')) return '+' + c.replace(/\D/g, '')
  return c.replace(/[.\-/\s()]/g, '')
}

export function brCodePix({
  chave,
  nome,
  cidade,
  valor,
  txid = '***',
}: {
  chave: string
  nome: string
  cidade: string
  valor?: number
  txid?: string
}): string {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(chave))
  let p =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcento(nome, 25) || 'MDC') +
    campo('60', semAcento(cidade, 15) || 'CASSIA') +
    campo('62', campo('05', txid))
  p += '6304'
  return p + crc16(p)
}
