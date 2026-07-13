/**
 * Relatório de conferência da CAMPANHA DE PONTOS.
 *
 * FONTE ÚNICA: usa exatamente os mesmos lançamentos que alimentam o ranking de
 * pontos (controle_diario × pontos de campanha_servicos), no mesmo período
 * (ciclo 26→25, fuso America/Sao_Paulo via inicioIso/fimIso) e com o mesmo
 * critério de agregação. Assim o subtotal de cada barbeiro e o total da equipe
 * BATEM exatamente com o ranking — não há caminho de cálculo paralelo.
 *
 * Espelha a lógica de app/dashboard/page.tsx / app/b/[codigo]/page.tsx:
 *  - considera TODAS as campanhas da barbearia (um controle pode referenciar
 *    servico_id de campanha de outro mês);
 *  - filtra controle_diario pela janela de datas do ciclo;
 *  - pontos por lançamento = quantidade × pontos do serviço.
 *
 * Só leitura — não altera campanha nem lançamentos.
 */

export interface AtividadeLinha {
  servicoId: string
  nome: string
  emoji: string
  pontosUnit: number
  qtd: number          // soma de quantidade (nº de lançamentos/unidades)
  pontosTotais: number // qtd × pontosUnit
}

export interface BarbeiroRelatorio {
  barbeiroId: string
  nome: string
  tipo: string
  subtotal: number     // === pontuação do barbeiro no ranking do período
  atividades: AtividadeLinha[]
}

export interface RelatorioPontos {
  atividadesEquipe: AtividadeLinha[]
  totalEquipe: number      // === total de pontos da equipe no ranking do período
  totalLancamentos: number // soma de todas as quantidades
  barbeiros: BarbeiroRelatorio[]
}

interface ServicoInfo { nome: string; emoji: string; pontos: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

function ordenarAtividades(a: AtividadeLinha, b: AtividadeLinha) {
  return b.pontosTotais - a.pontosTotais || a.nome.localeCompare(b.nome)
}

export async function gerarRelatorioPontos(
  supabase: SupabaseLike,
  barbeariaId: string,
  inicioIso: string,
  fimIso: string,
): Promise<RelatorioPontos> {
  // Todas as campanhas da barbearia (mesmo critério do ranking).
  const { data: todasCampRaw } = await supabase
    .from('campanha').select('id').eq('barbearia_id', barbeariaId)
  const todasCampIds = ((todasCampRaw ?? []) as { id: string }[]).map(c => c.id)

  const vazio: RelatorioPontos = { atividadesEquipe: [], totalEquipe: 0, totalLancamentos: 0, barbeiros: [] }
  if (todasCampIds.length === 0) return vazio

  // Serviços (id → nome/emoji/pontos) cobrindo TODAS as campanhas.
  const { data: servRaw } = await supabase
    .from('campanha_servicos').select('id, nome, emoji, pontos').in('campanha_id', todasCampIds)
  const servInfo = new Map<string, ServicoInfo>()
  for (const s of (servRaw ?? []) as { id: string; nome: string; emoji: string | null; pontos: number }[]) {
    servInfo.set(s.id, { nome: s.nome, emoji: s.emoji ?? '•', pontos: Number(s.pontos) || 0 })
  }

  // Lançamentos do ciclo (mesma janela e filtro do ranking).
  const { data: controlesRaw } = await supabase
    .from('controle_diario')
    .select('barbeiro_id, servico_id, quantidade')
    .in('campanha_id', todasCampIds)
    .gte('data', inicioIso)
    .lte('data', fimIso)
  const controles = (controlesRaw ?? []) as { barbeiro_id: string; servico_id: string; quantidade: number }[]

  // Nomes dos barbeiros (ativos e inativos que tenham lançamento no período).
  const { data: barbRaw } = await supabase
    .from('barbeiros').select('id, nome, tipo').eq('barbearia_id', barbeariaId)
  const barbInfo = new Map<string, { nome: string; tipo: string }>()
  for (const b of (barbRaw ?? []) as { id: string; nome: string; tipo: string }[]) {
    barbInfo.set(b.id, { nome: b.nome, tipo: b.tipo })
  }

  const infoDoServico = (id: string): ServicoInfo => servInfo.get(id) ?? { nome: 'Atividade removida', emoji: '•', pontos: 0 }

  // Agregação por atividade (equipe) e por (barbeiro, atividade).
  const equipe = new Map<string, AtividadeLinha>()
  const porBarbeiro = new Map<string, Map<string, AtividadeLinha>>()
  let totalLancamentos = 0

  for (const cd of controles) {
    const qtd = Number(cd.quantidade) || 0
    if (qtd === 0) continue
    totalLancamentos += qtd
    const info = infoDoServico(cd.servico_id)
    const pontos = qtd * info.pontos

    const e = equipe.get(cd.servico_id) ?? { servicoId: cd.servico_id, nome: info.nome, emoji: info.emoji, pontosUnit: info.pontos, qtd: 0, pontosTotais: 0 }
    e.qtd += qtd; e.pontosTotais += pontos
    equipe.set(cd.servico_id, e)

    const mb = porBarbeiro.get(cd.barbeiro_id) ?? new Map<string, AtividadeLinha>()
    const b = mb.get(cd.servico_id) ?? { servicoId: cd.servico_id, nome: info.nome, emoji: info.emoji, pontosUnit: info.pontos, qtd: 0, pontosTotais: 0 }
    b.qtd += qtd; b.pontosTotais += pontos
    mb.set(cd.servico_id, b)
    porBarbeiro.set(cd.barbeiro_id, mb)
  }

  const atividadesEquipe = Array.from(equipe.values()).sort(ordenarAtividades)
  const totalEquipe = atividadesEquipe.reduce((s, a) => s + a.pontosTotais, 0)

  const barbeiros: BarbeiroRelatorio[] = Array.from(porBarbeiro.entries())
    .map(([barbeiroId, mb]) => {
      const atividades = Array.from(mb.values()).sort(ordenarAtividades)
      const subtotal = atividades.reduce((s, a) => s + a.pontosTotais, 0)
      const info = barbInfo.get(barbeiroId)
      return { barbeiroId, nome: info?.nome ?? 'Barbeiro removido', tipo: info?.tipo ?? 'barbeiro', subtotal, atividades }
    })
    .filter(b => b.subtotal !== 0 || b.atividades.length > 0)
    .sort((a, b) => b.subtotal - a.subtotal || a.nome.localeCompare(b.nome))

  return { atividadesEquipe, totalEquipe, totalLancamentos, barbeiros }
}

export interface RelatorioPontosBarbeiro {
  atividades: AtividadeLinha[]
  total: number            // === pontuação do barbeiro no ranking do período
  totalLancamentos: number // soma das quantidades do barbeiro
}

/**
 * Versão INDIVIDUAL do relatório — só o próprio barbeiro (link /b/[codigo]).
 *
 * PRIVACIDADE: a query de `controle_diario` é filtrada por `barbeiro_id`, então
 * NUNCA retorna lançamento de colega — o escopo é garantido no servidor, não só
 * escondido na tela. O barbeiro é identificado pelo segredo `link_codigo`
 * (resolvido antes de chamar esta função), mesmo padrão de feedbacks/conduta.
 *
 * FONTE ÚNICA: mesmas tabelas, mesma janela de ciclo (inicioIso/fimIso, fuso
 * America/Sao_Paulo) e mesma regra de agregação do ranking de pontos. Logo
 * `total` bate exatamente com a pontuação do barbeiro no ranking do período —
 * não há cálculo por caminho paralelo.
 */
export async function gerarRelatorioPontosBarbeiro(
  supabase: SupabaseLike,
  barbeariaId: string,
  barbeiroId: string,
  inicioIso: string,
  fimIso: string,
): Promise<RelatorioPontosBarbeiro> {
  const vazio: RelatorioPontosBarbeiro = { atividades: [], total: 0, totalLancamentos: 0 }

  // Todas as campanhas da barbearia (mesmo critério do ranking).
  const { data: todasCampRaw } = await supabase
    .from('campanha').select('id').eq('barbearia_id', barbeariaId)
  const todasCampIds = ((todasCampRaw ?? []) as { id: string }[]).map(c => c.id)
  if (todasCampIds.length === 0) return vazio

  // Serviços (id → nome/emoji/pontos) cobrindo TODAS as campanhas.
  const { data: servRaw } = await supabase
    .from('campanha_servicos').select('id, nome, emoji, pontos').in('campanha_id', todasCampIds)
  const servInfo = new Map<string, ServicoInfo>()
  for (const s of (servRaw ?? []) as { id: string; nome: string; emoji: string | null; pontos: number }[]) {
    servInfo.set(s.id, { nome: s.nome, emoji: s.emoji ?? '•', pontos: Number(s.pontos) || 0 })
  }
  const infoDoServico = (id: string): ServicoInfo => servInfo.get(id) ?? { nome: 'Atividade removida', emoji: '•', pontos: 0 }

  // SÓ os lançamentos DESTE barbeiro — filtro por barbeiro_id no servidor.
  const { data: controlesRaw } = await supabase
    .from('controle_diario')
    .select('servico_id, quantidade')
    .eq('barbeiro_id', barbeiroId)
    .in('campanha_id', todasCampIds)
    .gte('data', inicioIso)
    .lte('data', fimIso)
  const controles = (controlesRaw ?? []) as { servico_id: string; quantidade: number }[]

  const porAtividade = new Map<string, AtividadeLinha>()
  let totalLancamentos = 0
  for (const cd of controles) {
    const qtd = Number(cd.quantidade) || 0
    if (qtd === 0) continue
    totalLancamentos += qtd
    const info = infoDoServico(cd.servico_id)
    const linha = porAtividade.get(cd.servico_id)
      ?? { servicoId: cd.servico_id, nome: info.nome, emoji: info.emoji, pontosUnit: info.pontos, qtd: 0, pontosTotais: 0 }
    linha.qtd += qtd
    linha.pontosTotais += qtd * info.pontos
    porAtividade.set(cd.servico_id, linha)
  }

  const atividades = Array.from(porAtividade.values()).sort(ordenarAtividades)
  const total = atividades.reduce((s, a) => s + a.pontosTotais, 0)
  return { atividades, total, totalLancamentos }
}
