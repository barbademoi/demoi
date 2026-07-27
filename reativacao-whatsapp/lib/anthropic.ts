import Anthropic from '@anthropic-ai/sdk'

const MODELO = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

export function temChaveIA(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

// Pequenos empurrões de estilo pra garantir variação real entre clientes,
// mesmo quando a IA tende a convergir pro mesmo texto.
const ESTILOS = [
  'comece perguntando como o cliente está, de forma leve',
  'comece comentando que faz tempo que não vê o cliente por lá',
  'vá direto ao convite pra marcar um horário, sem rodeio',
  'use um tom de brincadeira leve sobre o cabelo/barba crescendo',
  'comece com uma saudação curta e cordial antes do convite',
]

interface ParamsMensagem {
  nome: string
  diasSemCortar: number
  instrucaoBase: string
  mensagensAnteriores?: string[]
}

export async function gerarMensagemReativacao(params: ParamsMensagem): Promise<string> {
  const { nome, diasSemCortar, instrucaoBase, mensagensAnteriores = [] } = params
  const estilo = ESTILOS[Math.floor(Math.random() * ESTILOS.length)]

  const partesAnteriores = mensagensAnteriores.slice(-5)
  const blocoAnteriores =
    partesAnteriores.length > 0
      ? `\n\nMensagens já usadas pra OUTROS clientes nesta sessão (NÃO repita a mesma abertura/estrutura destas):\n${partesAnteriores
          .map((m, i) => `${i + 1}. ${m}`)
          .join('\n')}`
      : ''

  const prompt = `Você escreve mensagens de WhatsApp pra uma barbearia reativar clientes que sumiram.

Instrução de tom do dono da barbearia: ${instrucaoBase}

Escreva UMA mensagem curta (2-3 frases, no máximo) pro cliente abaixo, convidando ele a marcar um novo horário.
Use o nome do cliente de forma natural. Não use emojis em excesso (no máximo 1, ou nenhum). Não invente promoções, descontos ou horários específicos.
Dica de abertura pra esta mensagem: ${estilo}.

Cliente: ${nome}
Dias sem cortar: ${diasSemCortar}${blocoAnteriores}

Responda APENAS com o texto da mensagem, sem aspas, sem prefixo, pronta pra copiar e enviar.`

  const msg = await client().messages.create({
    model: MODELO,
    max_tokens: 200,
    temperature: 1,
    messages: [{ role: 'user', content: prompt }],
  })

  const bloco = msg.content[0]
  const texto = bloco.type === 'text' ? bloco.text.trim() : ''
  if (!texto) throw new Error('A IA não retornou texto.')
  return texto
}
