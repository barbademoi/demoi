import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'
import type {
  LeituraRelatorioAgenda,
  ProfissionalRelatorioAgenda,
} from './types'

const EMAIL_DONO_EXTENSAO = 'barbeariademoi@gmail.com'
const LIMITE_MONETARIO = 100_000_000

type RegistroDesconhecido = Record<string, unknown>

function objeto(valor: unknown): RegistroDesconhecido | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  return valor as RegistroDesconhecido
}

function dataIso(valor: unknown, campo: string): string {
  if (typeof valor !== 'string') {
    throw new Error(`O campo ${campo} é inválido.`)
  }
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) throw new Error(`O campo ${campo} é inválido.`)

  const data = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ))
  if (
    data.getUTCFullYear() !== Number(match[1]) ||
    data.getUTCMonth() !== Number(match[2]) - 1 ||
    data.getUTCDate() !== Number(match[3])
  ) {
    throw new Error(`O campo ${campo} contém uma data inexistente.`)
  }
  return valor
}

function valorMonetario(valor: unknown, campo: string): number {
  let numero: number
  if (typeof valor === 'number') {
    numero = valor
  } else if (typeof valor === 'string') {
    const limpo = valor
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    numero = Number(limpo)
  } else {
    throw new Error(`O campo ${campo} é inválido.`)
  }

  if (
    !Number.isFinite(numero) ||
    numero < 0 ||
    numero > LIMITE_MONETARIO
  ) {
    throw new Error(`O campo ${campo} está fora do intervalo permitido.`)
  }
  return Math.round(numero * 100) / 100
}

function nomeProfissional(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new Error('Há um profissional sem nome no relatório.')
  }
  const nome = valor.replace(/\s+/g, ' ').trim()
  if (nome.length === 0 || nome.length > 200) {
    throw new Error('Há um nome de profissional inválido no relatório.')
  }
  return nome
}

function chaveNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

function lerProfissional(
  valor: unknown,
  indice: number,
): ProfissionalRelatorioAgenda {
  const item = objeto(valor)
  if (!item) throw new Error(`O profissional ${indice + 1} é inválido.`)

  const profissional = {
    nomeRelatorio: nomeProfissional(item.nomeRelatorio),
    servicosAcumulado: valorMonetario(
      item.servicosAcumulado,
      `serviços do profissional ${indice + 1}`,
    ),
    produtosAcumulado: valorMonetario(
      item.produtosAcumulado,
      `produtos do profissional ${indice + 1}`,
    ),
    assinaturasAcumulado: valorMonetario(
      item.assinaturasAcumulado,
      `assinaturas do profissional ${indice + 1}`,
    ),
    faturamentoAcumulado: valorMonetario(
      item.faturamentoAcumulado,
      `faturamento do profissional ${indice + 1}`,
    ),
    comissaoAcumulada: valorMonetario(
      item.comissaoAcumulada,
      `comissão do profissional ${indice + 1}`,
    ),
  }

  const composicao = Math.round((
    profissional.servicosAcumulado +
    profissional.produtosAcumulado +
    profissional.assinaturasAcumulado
  ) * 100) / 100
  if (Math.abs(composicao - profissional.faturamentoAcumulado) > 0.05) {
    throw new Error(
      `Os valores de ${profissional.nomeRelatorio} não conferem: o faturamento bruto precisa ser serviços + produtos + assinaturas.`,
    )
  }
  return profissional
}

export function validarTokenExtensao(request: Request): void {
  const configurado = process.env.AGENDA_EXTENSION_TOKEN?.trim()
  if (!configurado || configurado.length < 32) {
    throw new Error('TOKEN_EXTENSAO_NAO_CONFIGURADO')
  }

  const cabecalho = request.headers.get('authorization') ?? ''
  const recebido = cabecalho.startsWith('Bearer ')
    ? cabecalho.slice('Bearer '.length).trim()
    : ''
  const configuradoBuffer = Buffer.from(configurado)
  const recebidoBuffer = Buffer.from(recebido)
  if (
    configuradoBuffer.length !== recebidoBuffer.length ||
    !timingSafeEqual(configuradoBuffer, recebidoBuffer)
  ) {
    throw new Error('TOKEN_EXTENSAO_INVALIDO')
  }
}

export function validarLeituraExtensao(
  entrada: unknown,
): LeituraRelatorioAgenda {
  const payload = objeto(entrada)
  if (!payload) throw new Error('Os dados enviados pela extensão são inválidos.')

  const periodoInicio = dataIso(payload.periodoInicio, 'periodoInicio')
  const periodoFim = dataIso(payload.periodoFim, 'periodoFim')
  if (
    periodoInicio.slice(8) !== '01' ||
    periodoInicio.slice(0, 7) !== periodoFim.slice(0, 7) ||
    periodoInicio > periodoFim
  ) {
    throw new Error(
      'O relatório precisa começar no dia 01 e terminar no mesmo mês.',
    )
  }

  if (
    !Array.isArray(payload.profissionais) ||
    payload.profissionais.length === 0 ||
    payload.profissionais.length > 100
  ) {
    throw new Error('A lista de profissionais é inválida.')
  }
  const profissionais = payload.profissionais.map(lerProfissional)
  const nomes = profissionais.map(item => chaveNome(item.nomeRelatorio))
  if (new Set(nomes).size !== nomes.length) {
    throw new Error('O relatório contém profissionais repetidos.')
  }

  const totais = profissionais.reduce(
    (soma, item) => ({
      servicosAcumulado: soma.servicosAcumulado + item.servicosAcumulado,
      produtosAcumulado: soma.produtosAcumulado + item.produtosAcumulado,
      assinaturasAcumulado:
        soma.assinaturasAcumulado + item.assinaturasAcumulado,
      faturamentoAcumulado:
        soma.faturamentoAcumulado + item.faturamentoAcumulado,
      comissaoAcumulada: soma.comissaoAcumulada + item.comissaoAcumulada,
    }),
    {
      servicosAcumulado: 0,
      produtosAcumulado: 0,
      assinaturasAcumulado: 0,
      faturamentoAcumulado: 0,
      comissaoAcumulada: 0,
    },
  )

  return {
    periodoInicio,
    periodoFim,
    profissionais,
    totais: {
      servicosAcumulado: Math.round(totais.servicosAcumulado * 100) / 100,
      produtosAcumulado: Math.round(totais.produtosAcumulado * 100) / 100,
      assinaturasAcumulado:
        Math.round(totais.assinaturasAcumulado * 100) / 100,
      faturamentoAcumulado:
        Math.round(totais.faturamentoAcumulado * 100) / 100,
      comissaoAcumulada: Math.round(totais.comissaoAcumulada * 100) / 100,
    },
  }
}

export function hashLeituraExtensao(
  leitura: LeituraRelatorioAgenda,
): string {
  return createHash('sha256')
    .update(JSON.stringify({
      origem: 'extensao_chrome',
      emailDestino: EMAIL_DONO_EXTENSAO,
      leitura,
    }))
    .digest('hex')
}

export function itensRpcExtensao(
  leitura: LeituraRelatorioAgenda,
): Array<ProfissionalRelatorioAgenda> {
  return leitura.profissionais.map(item => ({ ...item }))
}

export const EMAIL_AUTORIZADO_EXTENSAO = EMAIL_DONO_EXTENSAO
