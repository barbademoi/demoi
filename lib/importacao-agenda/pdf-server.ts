import 'server-only'
import { extrairRelatorioAgenda } from './extrair'
import type {
  ItemTextoAgendaPdf,
  LeituraRelatorioAgenda,
} from './types'

const MAX_PDF_BYTES = 4 * 1024 * 1024

class MatrizPdfMinima {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0

  constructor(valores?: number[]) {
    if (valores?.length === 6) {
      ;[this.a, this.b, this.c, this.d, this.e, this.f] = valores
    }
  }
}

function prepararPdfJsNoServidor(): void {
  // O PDF.js referencia DOMMatrix ao carregar no Node, mesmo quando apenas
  // extraímos texto. Esta matriz mínima é suficiente porque não renderizamos.
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = MatrizPdfMinima as unknown as typeof DOMMatrix
  }
}

export function validarArquivoAgenda(file: File): void {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error('Selecione um arquivo PDF válido.')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('O PDF excede o limite de 4 MB.')
  }
  const extensao = file.name.split('.').pop()?.toLocaleLowerCase('pt-BR')
  if (extensao !== 'pdf' && file.type !== 'application/pdf') {
    throw new Error('Envie o relatório em formato PDF.')
  }
}

export async function lerRelatorioAgendaPdf(
  file: File,
): Promise<LeituraRelatorioAgenda> {
  validarArquivoAgenda(file)
  prepararPdfJsNoServidor()

  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const tarefa = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      useWorkerFetch: false,
      disableFontFace: true,
    })
    const documento = await tarefa.promise
    try {
      // Regra do Agenda Serviço: somente a tabela-resumo da página 1.
      const pagina = await documento.getPage(1)
      try {
        const conteudo = await pagina.getTextContent()
        const itens: ItemTextoAgendaPdf[] = conteudo.items
          .filter(
            (item): item is typeof item & { str: string; transform: number[] } =>
              'str' in item && 'transform' in item,
          )
          .map(item => ({
            str: item.str,
            transform: [...item.transform],
          }))
        if (itens.length < 10) {
          throw new Error(
            'A página 1 não contém texto selecionável suficiente para ler o relatório.',
          )
        }
        return extrairRelatorioAgenda(itens)
      } finally {
        pagina.cleanup()
      }
    } finally {
      await documento.destroy()
    }
  } catch (erro) {
    console.error('[importacao-agenda] Falha ao ler a página 1 do PDF:', erro)
    if (erro instanceof Error && (
      erro.message.includes('Agenda Serviço') ||
      erro.message.includes('período') ||
      erro.message.includes('profissionais') ||
      erro.message.includes('comissões') ||
      erro.message.includes('quantidade de valores') ||
      erro.message.includes('Nenhum dado') ||
      erro.message.includes('não confere') ||
      erro.message.includes('texto selecionável') ||
      erro.message.includes('começar no dia 01')
    )) {
      throw erro
    }
    const nome = erro && typeof erro === 'object' && 'name' in erro
      ? String(erro.name)
      : ''
    if (nome === 'PasswordException') {
      throw new Error('O PDF está protegido por senha.')
    }
    throw new Error(
      'Não foi possível ler a página 1. Confirme que este é o "Relatório de faturamento total" exportado pelo Agenda Serviço.',
    )
  }
}
