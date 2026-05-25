export function tempoDeCasa(dataEntrada: string | null): string | null {
  if (!dataEntrada) return null

  const entrada = new Date(dataEntrada)
  if (Number.isNaN(entrada.getTime())) return null

  const agora = new Date()
  let meses =
    (agora.getFullYear() - entrada.getFullYear()) * 12 +
    (agora.getMonth() - entrada.getMonth())
  if (agora.getDate() < entrada.getDate()) meses -= 1
  if (meses < 0) meses = 0

  if (meses < 1) return 'Entrou este mês'
  if (meses < 12) return `Há ${meses} ${meses === 1 ? 'mês' : 'meses'} na casa`

  const anos = Math.floor(meses / 12)
  const rem = meses % 12
  let txt = `Há ${anos} ${anos === 1 ? 'ano' : 'anos'}`
  if (rem > 0) txt += ` e ${rem} ${rem === 1 ? 'mês' : 'meses'}`
  return `${txt} na casa`
}
