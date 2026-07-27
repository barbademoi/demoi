import type {
  ArquivoLido,
  MapeamentoColunas,
  ResultadoAgregacao,
} from './types'

const MAX_ARQUIVO_BYTES = 15 * 1024 * 1024
const MAX_LINHAS = 50_000
const MAX_LANCAMENTOS_AGREGADOS = 5_000

type Celula = string | number | boolean | Date | null

function textoCelula(valor: Celula | undefined): string {
  if (valor == null) return ''
  if (valor instanceof Date) {
    const y = valor.getFullYear()
    const m = String(valor.getMonth() + 1).padStart(2, '0')
    const d = String(valor.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(valor).trim()
}

function deduplicarColunas(cabecalho: Celula[], largura: number): string[] {
  const usados = new Map<string, number>()
  return Array.from({ length: largura }, (_, i) => {
    const original = textoCelula(cabecalho[i]) || `Coluna ${i + 1}`
    const chave = original.toLocaleLowerCase('pt-BR')
    const repeticao = (usados.get(chave) ?? 0) + 1
    usados.set(chave, repeticao)
    return repeticao === 1 ? original : `${original} (${repeticao})`
  })
}

function detectarSeparador(texto: string): ',' | ';' | '\t' {
  const primeiraLinha = texto.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? ''
  const contar = (separador: string) => {
    let dentroAspas = false
    let total = 0
    for (let i = 0; i < primeiraLinha.length; i += 1) {
      if (primeiraLinha[i] === '"') dentroAspas = !dentroAspas
      if (!dentroAspas && primeiraLinha[i] === separador) total += 1
    }
    return total
  }
  const opcoes = [
    { separador: ';' as const, total: contar(';') },
    { separador: ',' as const, total: contar(',') },
    { separador: '\t' as const, total: contar('\t') },
  ].sort((a, b) => b.total - a.total)
  return opcoes[0].separador
}

/** Parser CSV com suporte a aspas, separadores dentro do texto e quebras na célula. */
export function parseCsv(textoOriginal: string): string[][] {
  const texto = textoOriginal.replace(/^\uFEFF/, '')
  const separador = detectarSeparador(texto)
  const linhas: string[][] = []
  let linha: string[] = []
  let celula = ''
  let dentroAspas = false

  for (let i = 0; i < texto.length; i += 1) {
    const char = texto[i]
    const proximo = texto[i + 1]
    if (char === '"') {
      if (dentroAspas && proximo === '"') {
        celula += '"'
        i += 1
      } else {
        dentroAspas = !dentroAspas
      }
      continue
    }
    if (!dentroAspas && char === separador) {
      linha.push(celula.trim())
      celula = ''
      continue
    }
    if (!dentroAspas && (char === '\n' || char === '\r')) {
      if (char === '\r' && proximo === '\n') i += 1
      linha.push(celula.trim())
      if (linha.some(v => v !== '')) linhas.push(linha)
      linha = []
      celula = ''
      continue
    }
    celula += char
  }
  linha.push(celula.trim())
  if (linha.some(v => v !== '')) linhas.push(linha)
  return linhas
}

export async function lerArquivo(file: File): Promise<ArquivoLido> {
  if (file.size <= 0) throw new Error('O arquivo está vazio.')
  if (file.size > MAX_ARQUIVO_BYTES) throw new Error('O arquivo excede o limite de 15 MB.')

  const extensao = file.name.split('.').pop()?.toLowerCase()
  let matriz: Celula[][]

  if (extensao === 'csv' || extensao === 'txt') {
    matriz = parseCsv(await file.text())
  } else if (extensao === 'xlsx') {
    const { default: readXlsxFile } = await import('read-excel-file/browser')
    matriz = await readXlsxFile(file) as Celula[][]
  } else if (extensao === 'xls') {
    throw new Error('Excel antigo (.xls) não é suportado. Salve como .xlsx ou CSV.')
  } else {
    throw new Error('Formato não suportado. Envie um arquivo CSV ou Excel (.xlsx).')
  }

  if (matriz.length < 2) throw new Error('O arquivo precisa ter cabeçalho e pelo menos uma linha de dados.')
  if (matriz.length - 1 > MAX_LINHAS) throw new Error(`O arquivo tem mais de ${MAX_LINHAS.toLocaleString('pt-BR')} linhas.`)

  const largura = Math.max(...matriz.slice(0, 100).map(l => l.length))
  const colunas = deduplicarColunas(matriz[0], largura)
  const linhas = matriz.slice(1).map(linha =>
    Array.from({ length: largura }, (_, i) => linha[i] ?? null),
  )
  return { colunas, linhas, totalLinhas: linhas.length }
}

function normalizarCabecalho(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function acharColuna(colunas: string[], termos: string[]): number {
  const normalizadas = colunas.map(normalizarCabecalho)
  for (const termo of termos) {
    const exata = normalizadas.findIndex(c => c === termo)
    if (exata >= 0) return exata
  }
  for (const termo of termos) {
    const parcial = normalizadas.findIndex(c => c.includes(termo))
    if (parcial >= 0) return parcial
  }
  return -1
}

export function sugerirMapeamento(colunas: string[]): MapeamentoColunas {
  return {
    barbeiro: acharColuna(colunas, ['barbeiro', 'profissional', 'colaborador', 'funcionario', 'prestador', 'nome profissional']),
    data: acharColuna(colunas, ['data', 'data atendimento', 'dia', 'data venda', 'data servico']),
    valor: acharColuna(colunas, ['valor', 'valor total', 'total', 'faturamento', 'comissao', 'preco', 'receita']),
  }
}

export function normalizarNome(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function isoValido(ano: number, mes: number, dia: number): string | null {
  if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) return null
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function parseData(valor: Celula | undefined): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return isoValido(valor.getFullYear(), valor.getMonth() + 1, valor.getDate())
  }
  if (typeof valor === 'number' && Number.isFinite(valor) && valor > 20_000 && valor < 100_000) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    const data = new Date(excelEpoch + Math.floor(valor) * 86_400_000)
    return isoValido(data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate())
  }
  const texto = textoCelula(valor).split(/[T ]/, 1)[0]
  let match = texto.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (match) return isoValido(Number(match[1]), Number(match[2]), Number(match[3]))
  match = texto.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (match) return isoValido(Number(match[3]), Number(match[2]), Number(match[1]))
  return null
}

export function parseValorMonetario(valor: Celula | undefined): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  let texto = textoCelula(valor)
    .replace(/\u00a0/g, ' ')
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
  if (!texto) return null

  const negativoParenteses = /^\(.*\)$/.test(texto)
  texto = texto.replace(/[()]/g, '').replace(/[^0-9,.\-+]/g, '')
  if (!texto || texto === '-' || texto === '+') return null

  const ultimaVirgula = texto.lastIndexOf(',')
  const ultimoPonto = texto.lastIndexOf('.')
  const separadorDecimal = ultimaVirgula >= 0 && ultimoPonto >= 0
    ? (ultimaVirgula > ultimoPonto ? ',' : '.')
    : ultimaVirgula >= 0
      ? (texto.length - ultimaVirgula - 1 <= 2 ? ',' : null)
      : ultimoPonto >= 0
        ? (texto.length - ultimoPonto - 1 <= 2 ? '.' : null)
        : null

  let normalizado: string
  if (separadorDecimal) {
    const pos = texto.lastIndexOf(separadorDecimal)
    const inteiro = texto.slice(0, pos).replace(/[.,]/g, '')
    const decimal = texto.slice(pos + 1).replace(/[.,]/g, '')
    normalizado = `${inteiro}.${decimal}`
  } else {
    normalizado = texto.replace(/[.,]/g, '')
  }
  const numero = Number(normalizado)
  if (!Number.isFinite(numero)) return null
  return Math.round((negativoParenteses ? -numero : numero) * 100) / 100
}

export function agregarLinhas(
  arquivo: ArquivoLido,
  mapeamento: MapeamentoColunas,
): ResultadoAgregacao {
  if (mapeamento.barbeiro < 0 || mapeamento.data < 0 || mapeamento.valor < 0) {
    throw new Error('Selecione as colunas de barbeiro, data e valor.')
  }
  if (new Set(Object.values(mapeamento)).size !== 3) {
    throw new Error('Cada campo precisa usar uma coluna diferente.')
  }

  const avisos = {
    linhasVazias: 0,
    nomesVazios: 0,
    datasInvalidas: 0,
    valoresInvalidos: 0,
    valoresNegativos: 0,
    linhasValidas: 0,
  }
  const agrupadas = new Map<string, {
    nomeArquivo: string
    data: string
    valor: number
    linhasOriginais: number
  }>()

  for (const linha of arquivo.linhas) {
    if (linha.every(c => textoCelula(c).trim() === '')) {
      avisos.linhasVazias += 1
      continue
    }
    const nomeArquivo = textoCelula(linha[mapeamento.barbeiro])
    if (!nomeArquivo) {
      avisos.nomesVazios += 1
      continue
    }
    const data = parseData(linha[mapeamento.data])
    if (!data) {
      avisos.datasInvalidas += 1
      continue
    }
    const valor = parseValorMonetario(linha[mapeamento.valor])
    if (valor == null) {
      avisos.valoresInvalidos += 1
      continue
    }
    if (valor < 0) {
      avisos.valoresNegativos += 1
      continue
    }
    avisos.linhasValidas += 1
    const chave = `${normalizarNome(nomeArquivo)}|${data}`
    const existente = agrupadas.get(chave)
    if (existente) {
      existente.valor = Math.round((existente.valor + valor) * 100) / 100
      existente.linhasOriginais += 1
    } else {
      agrupadas.set(chave, { nomeArquivo, data, valor, linhasOriginais: 1 })
    }
  }

  const linhas = [...agrupadas.values()].sort((a, b) =>
    a.data.localeCompare(b.data) || a.nomeArquivo.localeCompare(b.nomeArquivo, 'pt-BR'),
  )
  if (linhas.length > MAX_LANCAMENTOS_AGREGADOS) {
    throw new Error(`A importação gerou mais de ${MAX_LANCAMENTOS_AGREGADOS.toLocaleString('pt-BR')} lançamentos. Divida o arquivo.`)
  }
  const nomesEncontrados = [...new Set(linhas.map(l => l.nomeArquivo))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return { linhas, nomesEncontrados, avisos }
}

export async function hashArquivo(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}
