'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BarbeiroImportado {
  nome: string
  comissao: number
  fat_servicos: number
  fat_assinaturas: number
  fat_produtos: number
}

export async function analisarRelatorio(texto: string): Promise<BarbeiroImportado[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Você receberá um relatório de uma barbearia. Extraia os dados de cada barbeiro: nome e valores de comissão, serviços, assinaturas e produtos. Retorne SOMENTE um JSON válido, sem texto adicional, sem markdown, sem blocos de código. Formato exato: [{"nome": "Nome do Barbeiro", "comissao": 0.00, "fat_servicos": 0.00, "fat_assinaturas": 0.00, "fat_produtos": 0.00}]

Se um campo não estiver disponível no relatório, use 0. Inclua todos os barbeiros encontrados.

Relatório:
${texto}`,
    }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Resposta inesperada da IA')

  const texto_resposta = content.text.trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim()

  const parsed = JSON.parse(texto_resposta)
  if (!Array.isArray(parsed)) throw new Error('Formato JSON inválido')
  return parsed as BarbeiroImportado[]
}

export async function confirmarImportacao(
  dados: BarbeiroImportado[],
  barbeariaId: string,
  mes: number,
  ano: number,
): Promise<{ ok: boolean; erros: string[] }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiros } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)

  const erros: string[] = []

  for (const dado of dados) {
    const nomeLower = dado.nome.toLowerCase().trim()
    const barbeiro = (barbeiros ?? []).find((b: { id: string; nome: string }) => {
      const bl = b.nome.toLowerCase().trim()
      return bl === nomeLower || bl.includes(nomeLower) || nomeLower.includes(bl)
    })

    if (!barbeiro) {
      erros.push(`Barbeiro não encontrado: "${dado.nome}"`)
      continue
    }

    const faturamentoTotal = (dado.fat_servicos ?? 0) + (dado.fat_assinaturas ?? 0) + (dado.fat_produtos ?? 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('lancamentos')
      .upsert({
        barbeiro_id: barbeiro.id,
        barbearia_id: barbeariaId,
        mes,
        ano,
        comissao_acumulada: dado.comissao,
        modo: 'direto',
        faturamento: faturamentoTotal > 0 ? faturamentoTotal : null,
      }, { onConflict: 'barbeiro_id,mes,ano' })

    if (error) erros.push(`Erro ao salvar ${dado.nome}: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return { ok: true, erros }
}
