import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

/** PIN de 4 dígitos → "scrypt$salt$hash" (só no servidor). */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pin, salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function conferirPin(pin: string, guardado: string | null): boolean {
  if (!guardado) return false
  const [alg, salt, hash] = guardado.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const calc = scryptSync(pin, salt, 32)
  const esperado = Buffer.from(hash, 'hex')
  return calc.length === esperado.length && timingSafeEqual(calc, esperado)
}

export function pinValido(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

/** Token longo e aleatório para o link /tarefix/c/[token]. */
export function novoToken(): string {
  return randomBytes(32).toString('hex')
}
