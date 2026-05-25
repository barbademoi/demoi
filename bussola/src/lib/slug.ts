import { randomInt } from 'node:crypto'

const ALFABETO = '0123456789abcdefghijklmnopqrstuvwxyz'

// Slug aleatório de 12 caracteres (~4,7 quintilhões de combinações).
// Sem datas, números sequenciais ou nome — impossível de adivinhar.
export function gerarSlug(tamanho = 12): string {
  let s = ''
  for (let i = 0; i < tamanho; i++) {
    s += ALFABETO[randomInt(ALFABETO.length)]
  }
  return s
}
