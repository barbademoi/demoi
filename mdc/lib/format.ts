/** Só os dígitos. */
export function digitos(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '')
}

/** (35) 99999-9999 enquanto digita. */
export function mascaraWhatsapp(v: string): string {
  const d = digitos(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatarWhatsapp(v: string | null | undefined): string {
  const d = digitos(v)
  const local = d.length > 11 && d.startsWith('55') ? d.slice(2) : d
  return mascaraWhatsapp(local)
}

/** Número para o wa.me: sempre com 55 na frente. */
export function whatsappInternacional(v: string | null | undefined): string {
  const d = digitos(v)
  if (d.length >= 12 && d.startsWith('55')) return d
  return `55${d}`
}

export function linkWhatsapp(numero: string | null | undefined, mensagem: string): string {
  return `https://wa.me/${whatsappInternacional(numero)}?text=${encodeURIComponent(mensagem)}`
}

export function primeiroNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().split(/\s+/)[0] ?? ''
}

/** Preenche [Nome], [data] etc. Aceita maiúscula ou minúscula. */
export function preencher(modelo: string, dados: Record<string, string>): string {
  return modelo.replace(/\[([^\]]+)\]/g, (todo, chave: string) => {
    const k = Object.keys(dados).find((x) => x.toLowerCase() === chave.trim().toLowerCase())
    return k !== undefined ? dados[k] : todo
  })
}

export function reais(valor: number | string | null | undefined): string {
  const n = typeof valor === 'string' ? Number(valor) : valor ?? 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Datas ────────────────────────────────────────────────────────────────
// Datas "de calendário" (início, vencimento) circulam como 'AAAA-MM-DD'.
// Toda conta é feita em UTC para não escorregar um dia por fuso.

/** Hoje em Brasília, 'AAAA-MM-DD'. */
export function hojeSP(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

function parse(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function somarDias(data: string, dias: number): string {
  const d = parse(data)
  d.setUTCDate(d.getUTCDate() + dias)
  return iso(d)
}

/** Soma meses sem pular mês: 31/01 + 1 mês = 28/02 (ou 29). */
export function somarMeses(data: string, meses: number): string {
  const d = parse(data)
  const dia = d.getUTCDate()
  const alvo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, 1))
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate()
  alvo.setUTCDate(Math.min(dia, ultimo))
  return iso(alvo)
}

export function diasEntre(de: string, ate: string): number {
  return Math.round((parse(ate).getTime() - parse(de).getTime()) / 86_400_000)
}

export function dataBR(data: string | null | undefined): string {
  if (!data) return '—'
  const [a, m, d] = data.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function dataHoraBR(ts: string | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
