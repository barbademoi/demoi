import Anthropic from '@anthropic-ai/sdk'

// Modelo padrão: Haiku 4.5 — rápido e barato, ideal pra sugestões curtas.
// Trocável por env sem mexer no código.
export const MODELO_IA = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'

let _client: Anthropic | null = null

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 15000, // 15s
      maxRetries: 2, // backoff automático do SDK
    })
  }
  return _client
}

export function temChaveIA(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export interface ResultadoIA {
  texto: string
  inputTokens: number
  outputTokens: number
  modelo: string
}

// Uma chamada simples (system + user) → texto. Server-side apenas.
export async function gerarTexto(system: string, user: string, maxTokens: number): Promise<ResultadoIA> {
  const resp = await anthropic().messages.create({
    model: MODELO_IA,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const texto = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  return {
    texto,
    inputTokens: resp.usage.input_tokens,
    outputTokens: resp.usage.output_tokens,
    modelo: resp.model,
  }
}
