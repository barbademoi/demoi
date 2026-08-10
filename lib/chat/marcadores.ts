/**
 * MARCADORES DO COMUNICADO — troca {marcador} pelos dados daquele assinante.
 *
 * LÓGICA PURA, sem IA e sem I/O: o texto é escrito por uma pessoa, e aqui só
 * encaixamos números que o sistema já tem. Nada é gerado, nada é recalculado —
 * os valores chegam prontos de `chat_contexto_barbearia()`, que usa a mesma
 * precedência de faturamento do painel do dono.
 *
 * SEM DADO NÃO PODE VIRAR ZERO. Uma barbearia que ainda não lançou nada no mês
 * tem faturamento null, não R$ 0,00 — dizer "você faturou R$ 0,00" é uma
 * afirmação falsa sobre o negócio de alguém, e num comunicado de retenção isso
 * é o oposto do objetivo.
 *
 * TEXTO ALTERNATIVO: `{falta_pra_meta|ainda dá tempo}` usa o que vem depois da
 * barra quando não há dado. Existe porque um fallback genérico produz frases
 * quebradas: "Faltam sem meta definida pra meta" não é aceitável, e só quem
 * escreveu a frase sabe como ela deve terminar sem o número.
 */

export interface ContextoChat {
  nome_barbearia: string | null
  faturamento_mes: number | null
  meta_mes: number | null
  falta_pra_meta: number | null
  posicao_ranking: number | null
  total_ranking: number | null
  qtd_barbeiros: number | null
  top_barbeiro: string | null
  dias_para_fechar: number | null
}

type Chave = keyof ContextoChat

interface Marcador {
  chave: Chave
  /** Como aparece na lista do admin. */
  descricao: string
  /** Texto usado quando não há dado e o admin não escreveu alternativa. */
  neutro: string
  formatar: (v: NonNullable<ContextoChat[Chave]>, ctx: ContextoChat) => string
}

const dinheiro = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const numero = (v: number) => new Intl.NumberFormat('pt-BR').format(v)

/**
 * A lista é a fonte da verdade: é ela que o painel do admin exibe e é contra
 * ela que a validação avisa "esse marcador não existe". Marcador novo entra
 * aqui e aparece nos dois lugares sozinho.
 */
export const MARCADORES: Marcador[] = [
  {
    chave: 'nome_barbearia',
    descricao: 'Nome da barbearia',
    neutro: 'sua barbearia',
    formatar: (v) => String(v),
  },
  {
    chave: 'faturamento_mes',
    descricao: 'Faturamento do ciclo atual',
    neutro: 'o faturamento do mês',
    formatar: (v) => dinheiro(Number(v)),
  },
  {
    chave: 'meta_mes',
    descricao: 'Meta coletiva do ciclo',
    neutro: 'a meta do mês',
    formatar: (v) => dinheiro(Number(v)),
  },
  {
    chave: 'falta_pra_meta',
    descricao: 'Quanto falta pra bater a meta',
    neutro: 'o que falta pra meta',
    formatar: (v) => dinheiro(Number(v)),
  },
  {
    chave: 'posicao_ranking',
    descricao: 'Posição no ranking de faturamento',
    neutro: 'sua posição',
    formatar: (v) => `${numero(Number(v))}º`,
  },
  {
    chave: 'total_ranking',
    descricao: 'Total de barbearias no ranking',
    neutro: 'as barbearias',
    formatar: (v) => numero(Number(v)),
  },
  {
    chave: 'qtd_barbeiros',
    descricao: 'Barbeiros ativos na equipe',
    neutro: 'sua equipe',
    formatar: (v) => numero(Number(v)),
  },
  {
    chave: 'top_barbeiro',
    descricao: 'Barbeiro que mais faturou no ciclo',
    neutro: 'a equipe',
    formatar: (v) => String(v),
  },
  {
    chave: 'dias_para_fechar',
    descricao: 'Dias até fechar o ciclo',
    neutro: 'os dias que faltam',
    formatar: (v) => {
      const n = Number(v)
      return n === 0 ? 'hoje' : `${numero(n)} ${n === 1 ? 'dia' : 'dias'}`
    },
  },
]

const PORCHAVE = new Map<string, Marcador>(MARCADORES.map((m) => [m.chave, m]))

/** `{chave}` ou `{chave|texto alternativo}`. */
const PADRAO = /\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}/gi

/** Espaço duplicado e pontuação órfã que sobram quando um marcador some. */
function limpar(texto: string): string {
  return texto
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.!?;:])/g, '$1')
    .replace(/[ \t]+$/gm, '')
}

export interface ResultadoRender {
  texto: string
  /** Marcadores usados que não existem — o admin precisa saber ANTES de publicar. */
  desconhecidos: string[]
  /** Marcadores válidos que caíram no texto neutro por falta de dado. */
  semDado: string[]
}

/**
 * Troca os marcadores pelos dados do assinante.
 *
 * Nunca lança e nunca devolve chaves na tela: um comunicado que chega com
 * "{falta_pra_meta}" cru é pior do que um sem número nenhum.
 */
export function renderizarComunicado(
  corpo: string,
  ctx: Partial<ContextoChat> | null | undefined,
): ResultadoRender {
  const desconhecidos: string[] = []
  const semDado: string[] = []
  const contexto = (ctx ?? {}) as Partial<ContextoChat>

  const texto = corpo.replace(PADRAO, (_todo, nomeRaw: string, alternativo?: string) => {
    const nome = nomeRaw.toLowerCase()
    const marcador = PORCHAVE.get(nome)
    const alt = alternativo?.trim()

    // Marcador que não existe: sai da frase em silêncio. O aviso vai pro admin
    // na hora de escrever, não pro cliente na hora de ler.
    if (!marcador) {
      if (!desconhecidos.includes(nome)) desconhecidos.push(nome)
      return alt ?? ''
    }

    const valor = contexto[marcador.chave]
    if (valor === null || valor === undefined || valor === '') {
      if (!semDado.includes(nome)) semDado.push(nome)
      return alt && alt.length > 0 ? alt : marcador.neutro
    }

    try {
      return marcador.formatar(valor as NonNullable<ContextoChat[Chave]>, contexto as ContextoChat)
    } catch {
      // Formatador não pode derrubar o comunicado inteiro.
      return alt && alt.length > 0 ? alt : marcador.neutro
    }
  })

  return { texto: limpar(texto), desconhecidos, semDado }
}

/** Só a validação, pro admin conferir antes de publicar. */
export function validarComunicado(corpo: string): { desconhecidos: string[] } {
  const desconhecidos: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(PADRAO.source, PADRAO.flags)
  while ((m = re.exec(corpo)) !== null) {
    const nome = m[1].toLowerCase()
    if (!PORCHAVE.has(nome) && !desconhecidos.includes(nome)) desconhecidos.push(nome)
  }
  return { desconhecidos }
}
