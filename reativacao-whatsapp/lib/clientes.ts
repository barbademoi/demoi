import { lerClientes, salvarClientes } from './store'
import { agoraSaoPauloISO } from './datas'
import type { Cliente } from './types'
import type { LinhaProcessada } from './parse'

/**
 * Mescla as linhas importadas com a base já existente (chave = telefone).
 * Preserva o status de "contatado" — só reseta se o cliente voltou a cortar
 * depois da data que constava antes (novo ciclo de reativação).
 */
export function mesclarClientes(linhas: LinhaProcessada[]): { novos: number; atualizados: number } {
  const base = lerClientes()
  const porTelefone = new Map(base.map((c) => [c.telefone, c]))
  const agora = agoraSaoPauloISO()

  let novos = 0
  let atualizados = 0

  for (const linha of linhas) {
    const existente = porTelefone.get(linha.telefone)

    if (!existente) {
      porTelefone.set(linha.telefone, {
        id: linha.telefone,
        nome: linha.nome,
        telefone: linha.telefone,
        ultimoCorte: linha.ultimoCorte,
        contatadoEm: null,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      novos++
      continue
    }

    const voltouACortar = linha.ultimoCorte > existente.ultimoCorte
    existente.nome = linha.nome
    existente.ultimoCorte = linha.ultimoCorte
    existente.atualizadoEm = agora
    if (voltouACortar) existente.contatadoEm = null
    atualizados++
  }

  salvarClientes(Array.from(porTelefone.values()))
  return { novos, atualizados }
}

export function marcarContatado(id: string, contatado: boolean): Cliente | null {
  const lista = lerClientes()
  const cliente = lista.find((c) => c.id === id)
  if (!cliente) return null
  cliente.contatadoEm = contatado ? agoraSaoPauloISO() : null
  salvarClientes(lista)
  return cliente
}
