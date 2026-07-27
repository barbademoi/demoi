const FUSO = 'America/Sao_Paulo'

/** Data de hoje em São Paulo, formato YYYY-MM-DD. */
export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(new Date())
}

/** Data e hora atuais em São Paulo, formato ISO local (sem conversão de fuso pelo consumidor). */
export function agoraSaoPauloISO(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00'
  return `${obter('year')}-${obter('month')}-${obter('day')}T${obter('hour')}:${obter('minute')}:${obter('second')}`
}

/** Dias corridos entre uma data YYYY-MM-DD e hoje (em São Paulo). */
export function diasDesde(dataYMD: string): number {
  const hoje = hojeSaoPaulo()
  const msPorDia = 24 * 60 * 60 * 1000
  const dHoje = Date.parse(`${hoje}T00:00:00Z`)
  const dRef = Date.parse(`${dataYMD}T00:00:00Z`)
  if (Number.isNaN(dHoje) || Number.isNaN(dRef)) return 0
  return Math.max(0, Math.round((dHoje - dRef) / msPorDia))
}

/** Formata YYYY-MM-DD pra dd/mm/aaaa (exibição). */
export function formatarDataBR(dataYMD: string): string {
  const [ano, mes, dia] = dataYMD.split('-')
  if (!ano || !mes || !dia) return dataYMD
  return `${dia}/${mes}/${ano}`
}

const MESES_EXCEL_EPOCH = Date.UTC(1899, 11, 30) // base do serial de datas do Excel

/**
 * Converte um valor de data vindo de CSV/Excel (string em vários formatos,
 * serial numérico do Excel, ou Date já parseado pelo SheetJS) pra YYYY-MM-DD.
 * Retorna null se não conseguir interpretar.
 */
export function parseDataFlexivel(valor: unknown): string | null {
  if (valor == null || valor === '') return null

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const ms = MESES_EXCEL_EPOCH + valor * 24 * 60 * 60 * 1000
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return null
    const ano = d.getUTCFullYear()
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(d.getUTCDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  const texto = String(valor).trim()
  if (!texto) return null

  // yyyy-mm-dd ou yyyy/mm/dd
  let m = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const [, ano, mes, dia] = m
    return validarData(Number(ano), Number(mes), Number(dia))
  }

  // dd-mm-yyyy, dd/mm/yyyy ou dd.mm.yyyy (padrão brasileiro)
  m = texto.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (m) {
    const [, dia, mes, anoStr] = m
    const ano = anoStr.length === 2 ? 2000 + Number(anoStr) : Number(anoStr)
    return validarData(ano, Number(mes), Number(dia))
  }

  return null
}

function validarData(ano: number, mes: number, dia: number): string | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null
  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}
