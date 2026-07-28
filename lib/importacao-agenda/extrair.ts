import type {
  ItemTextoAgendaPdf,
  LeituraRelatorioAgenda,
} from './types'

type LinhaTexto = {
  y: number
  itens: Array<{ texto: string; x: number }>
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

function dataIso(dia: string, mes: string, ano: string): string {
  const d = Number(dia)
  const m = Number(mes)
  const a = Number(ano)
  const data = new Date(Date.UTC(a, m - 1, d))
  if (
    data.getUTCFullYear() !== a ||
    data.getUTCMonth() !== m - 1 ||
    data.getUTCDate() !== d
  ) {
    throw new Error('O período informado no PDF contém uma data inválida.')
  }
  return `${ano}-${mes}-${dia}`
}

function parseBrl(texto: string): number {
  const numero = Number(
    texto
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  )
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`Valor monetário inválido no relatório: "${texto}".`)
  }
  return Math.round(numero * 100) / 100
}

function valoresBrl(texto: string): number[] {
  return (texto.match(/R\$\s*[\d.]+,\d{2}/gi) ?? []).map(parseBrl)
}

function agruparLinhas(itens: ItemTextoAgendaPdf[]): LinhaTexto[] {
  const validos = itens
    .map(item => ({
      texto: item.str.replace(/\s+/g, ' ').trim(),
      x: Number(item.transform?.[4]),
      y: Number(item.transform?.[5]),
    }))
    .filter(item =>
      item.texto &&
      Number.isFinite(item.x) &&
      Number.isFinite(item.y),
    )
    .sort((a, b) => b.y - a.y || a.x - b.x)

  const linhas: LinhaTexto[] = []
  for (const item of validos) {
    let linha = linhas.find(candidata => Math.abs(candidata.y - item.y) <= 2)
    if (!linha) {
      linha = { y: item.y, itens: [] }
      linhas.push(linha)
    }
    linha.itens.push({ texto: item.texto, x: item.x })
  }

  return linhas
    .sort((a, b) => b.y - a.y)
    .map(linha => ({
      ...linha,
      itens: linha.itens.sort((a, b) => a.x - b.x),
    }))
}

function textoLinha(linha: LinhaTexto): string {
  return linha.itens.map(item => item.texto).join(' ')
}

function acharLinha(
  linhas: LinhaTexto[],
  termo: string,
): LinhaTexto | undefined {
  const alvo = normalizar(termo)
  return linhas.find(linha => normalizar(textoLinha(linha)).includes(alvo))
}

function validarTotal(
  valores: number[],
  total: number,
  nomeTrilha: string,
): void {
  const soma = Math.round(valores.reduce((acc, valor) => acc + valor, 0) * 100) / 100
  if (Math.abs(soma - total) > 0.05) {
    throw new Error(
      `O total de ${nomeTrilha} não confere com a soma dos profissionais. Exporte novamente o relatório no Agenda Serviço.`,
    )
  }
}

function extrairLinhaMonetaria(
  linhas: LinhaTexto[],
  termo: string,
  quantidadeProfissionais: number,
): { valores: number[]; total: number } {
  const linha = acharLinha(linhas, termo)
  if (!linha) {
    throw new Error(`O relatório precisa conter a linha "${termo}".`)
  }

  const valoresComTotal = valoresBrl(textoLinha(linha))
  if (valoresComTotal.length !== quantidadeProfissionais + 1) {
    throw new Error(
      `A quantidade de valores na linha "${termo}" não corresponde às colunas de profissionais.`,
    )
  }

  const total = valoresComTotal.at(-1) ?? 0
  const valores = valoresComTotal.slice(0, -1)
  validarTotal(valores, total, termo)
  return { valores, total }
}

function validarComposicaoFaturamento(
  servicos: number[],
  produtos: number[],
  assinaturas: number[],
  faturamentos: number[],
): void {
  for (let indice = 0; indice < faturamentos.length; indice += 1) {
    const composicao = Math.round(
      (servicos[indice] + produtos[indice] + assinaturas[indice]) * 100,
    ) / 100
    if (Math.abs(composicao - faturamentos[indice]) > 0.05) {
      throw new Error(
        'O faturamento bruto não confere com serviços + produtos + assinaturas. Exporte novamente o relatório no Agenda Serviço.',
      )
    }
  }
}

/**
 * Leitor estrito do formato "Relatório de faturamento total" do Agenda Serviço.
 * Recebe somente os itens de texto da página 1 e falha fechado quando o formato
 * não corresponde ao esperado, evitando que valores errados cheguem à prévia.
 */
export function extrairRelatorioAgenda(
  itens: ItemTextoAgendaPdf[],
): LeituraRelatorioAgenda {
  const linhas = agruparLinhas(itens)
  const paginaTexto = normalizar(linhas.map(textoLinha).join(' '))

  if (
    !paginaTexto.includes('agenda servico') ||
    !paginaTexto.includes('relatorio de faturamento total')
  ) {
    throw new Error(
      'Este PDF não é o "Relatório de faturamento total" do Agenda Serviço.',
    )
  }

  const periodoMatch = paginaTexto.match(
    /periodo:\s*(\d{2})-(\d{2})-(\d{4})\s+a\s+(\d{2})-(\d{2})-(\d{4})/,
  )
  if (!periodoMatch) {
    throw new Error('Não foi possível identificar o período na página 1 do relatório.')
  }
  const periodoInicio = dataIso(periodoMatch[1], periodoMatch[2], periodoMatch[3])
  const periodoFim = dataIso(periodoMatch[4], periodoMatch[5], periodoMatch[6])
  if (
    periodoMatch[1] !== '01' ||
    periodoMatch[2] !== periodoMatch[5] ||
    periodoMatch[3] !== periodoMatch[6] ||
    periodoInicio > periodoFim
  ) {
    throw new Error(
      'O relatório precisa começar no dia 01 e terminar no mesmo mês.',
    )
  }

  const cabecalho = acharLinha(linhas, 'Profissional')
  if (!cabecalho) {
    throw new Error('Não foi possível identificar as colunas de profissionais.')
  }
  const indiceProfissional = cabecalho.itens.findIndex(item =>
    normalizar(item.texto) === 'profissional',
  )
  const indiceTotal = cabecalho.itens.findIndex(item =>
    normalizar(item.texto) === 'total',
  )
  if (
    indiceProfissional < 0 ||
    indiceTotal <= indiceProfissional + 1
  ) {
    throw new Error('O cabeçalho de profissionais está fora do formato esperado.')
  }
  const nomes = cabecalho.itens
    .slice(indiceProfissional + 1, indiceTotal)
    .map(item => item.texto.trim())
  if (
    nomes.length === 0 ||
    nomes.length > 100 ||
    new Set(nomes.map(normalizar)).size !== nomes.length
  ) {
    throw new Error('Os nomes dos profissionais na página 1 são inválidos ou repetidos.')
  }

  const servicos = extrairLinhaMonetaria(linhas, 'Serviços', nomes.length)
  const produtos = extrairLinhaMonetaria(linhas, 'Produtos', nomes.length)
  const assinaturas = extrairLinhaMonetaria(linhas, 'Assinaturas', nomes.length)
  const faturamento = extrairLinhaMonetaria(
    linhas,
    'Rendimento total bruto',
    nomes.length,
  )
  const comissao = extrairLinhaMonetaria(
    linhas,
    'Total em comissões',
    nomes.length,
  )
  validarComposicaoFaturamento(
    servicos.valores,
    produtos.valores,
    assinaturas.valores,
    faturamento.valores,
  )

  return {
    periodoInicio,
    periodoFim,
    profissionais: nomes.map((nomeRelatorio, indice) => ({
      nomeRelatorio,
      servicosAcumulado: servicos.valores[indice],
      produtosAcumulado: produtos.valores[indice],
      assinaturasAcumulado: assinaturas.valores[indice],
      faturamentoAcumulado: faturamento.valores[indice],
      comissaoAcumulada: comissao.valores[indice],
    })),
    totais: {
      servicosAcumulado: servicos.total,
      produtosAcumulado: produtos.total,
      assinaturasAcumulado: assinaturas.total,
      faturamentoAcumulado: faturamento.total,
      comissaoAcumulada: comissao.total,
    },
  }
}
