import * as XLSX from 'xlsx'
import { parseDataFlexivel } from './datas'
import { normalizarTelefone } from './telefone'
import type { LinhaImportada } from './types'

export interface LinhaProcessada {
  linha: number
  nome: string
  telefone: string
  telefoneValido: boolean
  ultimoCorte: string
}

const CANDIDATOS_NOME = ['nome do cliente', 'nome cliente', 'cliente', 'nome']
const CANDIDATOS_TELEFONE = ['telefone', 'celular', 'whatsapp', 'whats', 'fone', 'contato', 'ddd']
const CANDIDATOS_DATA = ['data do último corte', 'ultimo corte', 'último corte', 'data ultimo corte', 'data', 'ultima visita', 'última visita']

function normalizarCabecalho(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

function encontrarColuna(cabecalhos: string[], candidatos: string[]): string | null {
  const normalizados = cabecalhos.map((c) => ({ original: c, norm: normalizarCabecalho(c) }))

  // 1) match exato
  for (const cand of candidatos) {
    const achado = normalizados.find((c) => c.norm === cand)
    if (achado) return achado.original
  }
  // 2) match por conter a palavra-chave
  for (const cand of candidatos) {
    const achado = normalizados.find((c) => c.norm.includes(cand))
    if (achado) return achado.original
  }
  return null
}

function detectarDelimitadorCSV(linhaCabecalho: string): string {
  const virgulas = (linhaCabecalho.match(/,/g) || []).length
  const pontoVirgulas = (linhaCabecalho.match(/;/g) || []).length
  return pontoVirgulas > virgulas ? ';' : ','
}

function parseLinhaCSV(linha: string, delim: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroAspas = false
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i]
    if (dentroAspas) {
      if (ch === '"') {
        if (linha[i + 1] === '"') {
          atual += '"'
          i++
        } else {
          dentroAspas = false
        }
      } else {
        atual += ch
      }
    } else if (ch === '"') {
      dentroAspas = true
    } else if (ch === delim) {
      campos.push(atual.trim())
      atual = ''
    } else {
      atual += ch
    }
  }
  campos.push(atual.trim())
  return campos
}

/**
 * Parser de CSV feito à mão (em vez de deixar o SheetJS interpretar o CSV):
 * o SheetJS tenta "adivinhar" datas em texto de CSV usando formato dos EUA
 * (MM/DD/AAAA), o que inverte silenciosamente dia e mês em datas brasileiras
 * (DD/MM/AAAA). Lendo como texto puro, quem interpreta a data é sempre o
 * nosso parseDataFlexivel, que sabe o formato brasileiro.
 */
function lerCSV(buffer: Buffer): Record<string, string>[] {
  let texto = buffer.toString('utf-8')
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1) // remove BOM

  const linhas = texto.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  if (linhas.length === 0) return []

  const delim = detectarDelimitadorCSV(linhas[0])
  const cabecalhos = parseLinhaCSV(linhas[0], delim)

  return linhas.slice(1).map((linha) => {
    const campos = parseLinhaCSV(linha, delim)
    const registro: Record<string, string> = {}
    cabecalhos.forEach((cab, i) => {
      registro[cab] = campos[i] ?? ''
    })
    return registro
  })
}

/** Lê um arquivo CSV/XLSX (buffer) e devolve as linhas já mapeadas pras colunas certas. */
export function lerPlanilha(
  buffer: Buffer,
  nomeArquivo: string
): { linhas: LinhaProcessada[]; ignorados: LinhaImportada[] } {
  const ext = nomeArquivo.toLowerCase().split('.').pop()

  let registros: Record<string, unknown>[]
  if (ext === 'csv') {
    registros = lerCSV(buffer)
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const primeiraAba = workbook.SheetNames[0]
    const sheet = workbook.Sheets[primeiraAba]
    registros = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  }

  const linhas: LinhaProcessada[] = []
  const ignorados: LinhaImportada[] = []

  if (registros.length === 0) return { linhas, ignorados }

  const cabecalhos = Object.keys(registros[0])
  const colNome = encontrarColuna(cabecalhos, CANDIDATOS_NOME)
  const colTelefone = encontrarColuna(cabecalhos, CANDIDATOS_TELEFONE)
  const colData = encontrarColuna(cabecalhos, CANDIDATOS_DATA)

  if (!colNome || !colTelefone || !colData) {
    throw new Error(
      `Não consegui identificar as colunas no arquivo. Encontrado: nome=${colNome ?? '?'}, telefone=${colTelefone ?? '?'}, data=${colData ?? '?'}. ` +
        'Confira se o arquivo tem colunas de nome, telefone e data do último corte.'
    )
  }

  registros.forEach((registro, idx) => {
    const numeroLinha = idx + 2 // +1 cabeçalho, +1 base 1
    const nomeBruto = String(registro[colNome] ?? '').trim()
    const telefoneBruto = registro[colTelefone]
    const dataBruta = registro[colData]

    const nome = nomeBruto
    const { numero, valido } = normalizarTelefone(telefoneBruto)
    const ultimoCorte = parseDataFlexivel(dataBruta)

    if (!nome || !valido || !ultimoCorte) {
      ignorados.push({
        linha: numeroLinha,
        nome: nomeBruto,
        telefoneOriginal: String(telefoneBruto ?? ''),
        dataOriginal: String(dataBruta ?? ''),
        erro: !nome ? 'nome vazio' : !valido ? 'telefone inválido' : 'data inválida',
      })
      return
    }

    linhas.push({ linha: numeroLinha, nome, telefone: numero, telefoneValido: valido, ultimoCorte })
  })

  return { linhas, ignorados }
}
