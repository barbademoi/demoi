export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

const CORES = [
  '#1F3A52', '#3B6B8F', '#4E7A5E', '#9A6A3C',
  '#7A5C9E', '#A85563', '#4F6D7A', '#8A6D3B',
]

// Cor estável derivada do nome (mesmo nome → mesma cor).
export function corDoNome(nome: string): string {
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CORES[Math.abs(hash) % CORES.length]
}
