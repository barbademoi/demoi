import type { ArquivoLido } from './types'

interface ItemTextoPdf {
  str: string
  transform: number[]
  width?: number
  height?: number
}

interface CelulaPosicionada {
  texto: string
  x: number
  fimX: number
}

interface LinhaPosicionada {
  pagina: number
  y: number
  celulas: CelulaPosicionada[]
}

const TERMOS_CABECALHO = [
  'barbeiro',
  'profissional',
  'colaborador',
  'funcionario',
  'prestador',
  'data',
  'dia',
  'valor',
  'total',
  'faturamento',
  'comissao',
  'preco',
  'receita',
]

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function mediana(numeros: number[]): number {
  if (numeros.length === 0) return 10
  const ordenados = [...numeros].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio]
}

function agruparPagina(
  itens: ItemTextoPdf[],
  pagina: number,
): LinhaPosicionada[] {
  const validos = itens
    .map(item => {
      const texto = item.str.replace(/\s+/g, ' ').trim()
      const x = Number(item.transform?.[4] ?? 0)
      const y = Number(item.transform?.[5] ?? 0)
      const altura = Math.abs(Number(item.height ?? item.transform?.[3] ?? 10)) || 10
      const largura = Math.max(Number(item.width ?? 0), texto.length * altura * 0.36)
      return { texto, x, y, altura, largura }
    })
    .filter(item => item.texto && Number.isFinite(item.x) && Number.isFinite(item.y))

  const alturaMediana = mediana(validos.map(item => item.altura))
  const toleranciaY = Math.max(2, Math.min(5, alturaMediana * 0.35))
  const grupos: Array<{
    y: number
    itens: typeof validos
  }> = []

  for (const item of validos.sort((a, b) => b.y - a.y || a.x - b.x)) {
    let grupo = grupos.find(candidato => Math.abs(candidato.y - item.y) <= toleranciaY)
    if (!grupo) {
      grupo = { y: item.y, itens: [] }
      grupos.push(grupo)
    }
    grupo.itens.push(item)
    grupo.y = grupo.itens.reduce((soma, atual) => soma + atual.y, 0) / grupo.itens.length
  }

  return grupos
    .sort((a, b) => b.y - a.y)
    .map(grupo => {
      const itensOrdenados = grupo.itens.sort((a, b) => a.x - b.x)
      const alturaLinha = mediana(itensOrdenados.map(item => item.altura))
      const separacaoMinima = Math.max(8, Math.min(22, alturaLinha * 1.45))
      const celulas: CelulaPosicionada[] = []

      for (const item of itensOrdenados) {
        const ultima = celulas[celulas.length - 1]
        const fimX = item.x + item.largura
        if (ultima && item.x - ultima.fimX <= separacaoMinima) {
          ultima.texto = `${ultima.texto} ${item.texto}`.replace(/\s+/g, ' ').trim()
          ultima.fimX = Math.max(ultima.fimX, fimX)
        } else {
          celulas.push({ texto: item.texto, x: item.x, fimX })
        }
      }

      return { pagina, y: grupo.y, celulas }
    })
}

function pontuarCabecalho(linha: LinhaPosicionada): number {
  const texto = normalizar(linha.celulas.map(celula => celula.texto).join(' '))
  return TERMOS_CABECALHO.filter(termo =>
    new RegExp(`(^| )${termo}( |$)`).test(texto),
  ).length
}

function escolherLinhaModelo(linhas: LinhaPosicionada[]): {
  indice: number
  cabecalhoDetectado: boolean
} {
  let melhorCabecalho = { indice: -1, pontos: 0 }
  linhas.forEach((linha, indice) => {
    const pontos = pontuarCabecalho(linha)
    if (linha.celulas.length >= 2 && pontos > melhorCabecalho.pontos) {
      melhorCabecalho = { indice, pontos }
    }
  })
  if (melhorCabecalho.indice >= 0 && melhorCabecalho.pontos >= 2) {
    return { indice: melhorCabecalho.indice, cabecalhoDetectado: true }
  }

  let melhor = { indice: -1, pontos: -1 }
  linhas.slice(0, 80).forEach((linha, indice) => {
    if (linha.celulas.length < 2 || linha.celulas.length > 20) return
    const proximas = linhas.slice(indice + 1, indice + 5)
    const semelhantes = proximas.filter(proxima =>
      Math.abs(proxima.celulas.length - linha.celulas.length) <= 1,
    ).length
    const pontos = linha.celulas.length * 3 + semelhantes * 2
    if (pontos > melhor.pontos) melhor = { indice, pontos }
  })
  return { indice: melhor.indice, cabecalhoDetectado: false }
}

function projetarNasColunas(
  linha: LinhaPosicionada,
  ancoras: number[],
): string[] {
  const resultado = Array.from({ length: ancoras.length }, () => '')
  const limites = ancoras.slice(0, -1).map((ancora, indice) =>
    (ancora + ancoras[indice + 1]) / 2,
  )

  for (const celula of linha.celulas) {
    let coluna = limites.findIndex(limite => celula.x < limite)
    if (coluna < 0) coluna = ancoras.length - 1
    resultado[coluna] = resultado[coluna]
      ? `${resultado[coluna]} ${celula.texto}`
      : celula.texto
  }
  return resultado.map(valor => valor.replace(/\s+/g, ' ').trim())
}

/**
 * Converte texto posicionado do PDF em uma matriz tabular. A função é exportada
 * para que o agrupamento possa ser testado sem depender do worker do PDF.js.
 */
export function matrizDeItensPdf(
  paginas: ItemTextoPdf[][],
): ArquivoLido {
  const linhas = paginas.flatMap((itens, indice) => agruparPagina(itens, indice + 1))
  const comTabela = linhas.filter(linha => linha.celulas.length >= 2)
  if (comTabela.length === 0) {
    throw new Error(
      'Não encontramos uma tabela com texto selecionável neste PDF. Se ele foi escaneado como imagem, exporte o relatório como PDF textual, CSV ou Excel.',
    )
  }

  const modelo = escolherLinhaModelo(comTabela)
  if (modelo.indice < 0) {
    throw new Error('Não foi possível identificar as colunas do PDF.')
  }

  const linhaModelo = comTabela[modelo.indice]
  const ancoras = linhaModelo.celulas.map(celula => celula.x)
  if (ancoras.length < 2) {
    throw new Error('Não foi possível identificar pelo menos duas colunas no PDF.')
  }

  const cabecalho = modelo.cabecalhoDetectado
    ? projetarNasColunas(linhaModelo, ancoras)
    : ancoras.map((_, indice) => `Coluna ${indice + 1}`)
  const assinaturaCabecalho = cabecalho.map(normalizar).join('|')
  const inicioDados = modelo.cabecalhoDetectado ? modelo.indice + 1 : modelo.indice
  const dados = comTabela
    .slice(inicioDados)
    .map(linha => projetarNasColunas(linha, ancoras))
    .filter(linha => linha.some(valor => valor !== ''))
    .filter(linha => linha.map(normalizar).join('|') !== assinaturaCabecalho)

  if (dados.length === 0) {
    throw new Error('O PDF tem colunas, mas não encontramos linhas de dados.')
  }

  return {
    colunas: cabecalho.map((valor, indice) => valor || `Coluna ${indice + 1}`),
    linhas: dados,
    totalLinhas: dados.length,
  }
}

export async function lerPdf(file: File): Promise<ArquivoLido> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      // Arquivo servido estaticamente para o Next não tentar minificar o worker
      // ESM do PDF.js como um script clássico.
      pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs'
    }

    const tarefa = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
    })
    const documento = await tarefa.promise
    const paginas: ItemTextoPdf[][] = []
    try {
      for (let numero = 1; numero <= documento.numPages; numero += 1) {
        const pagina = await documento.getPage(numero)
        const conteudo = await pagina.getTextContent()
        paginas.push(conteudo.items.filter(
          (item): item is typeof item & { str: string; transform: number[] } =>
            'str' in item && 'transform' in item,
        ).map(item => ({
          str: item.str,
          transform: [...item.transform],
          width: 'width' in item ? item.width : undefined,
          height: 'height' in item ? item.height : undefined,
        })))
        pagina.cleanup()
      }
    } finally {
      await documento.destroy()
    }

    const totalItens = paginas.reduce((soma, itens) => soma + itens.length, 0)
    if (totalItens < 3) {
      throw new Error(
        'Este PDF não possui texto selecionável. Se ele foi escaneado como imagem, exporte o relatório como PDF textual, CSV ou Excel.',
      )
    }
    return matrizDeItensPdf(paginas)
  } catch (erro) {
    if (erro instanceof Error && (
      erro.message.includes('texto selecionável') ||
      erro.message.includes('identificar') ||
      erro.message.includes('linhas de dados')
    )) {
      throw erro
    }
    const nome = erro && typeof erro === 'object' && 'name' in erro
      ? String(erro.name)
      : ''
    if (nome === 'PasswordException') {
      throw new Error('O PDF está protegido por senha. Remova a senha antes de importar.')
    }
    throw new Error('Não foi possível ler o PDF. Verifique se o arquivo está íntegro e contém uma tabela.')
  }
}
