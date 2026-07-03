// Helpers pra copiar campanha (config + servicos + premios) e modo_mes
// do ciclo anterior quando o dono nao configurou pro ciclo atual.
//
// Motivacao: dono reclama que ao virar o mes/ciclo, a campanha de pontos
// "volta ao padrao" — porque a query em dashboard/page.tsx nao acha row
// pra (mes, ano) atual e a UI cai pros defaults. Solucao: no read, se nao
// achar, copia a configuracao do ciclo anterior.
//
// Idempotente: se a row do ciclo atual ja existe, nao faz nada.
// Sem race: usa insert() (nao upsert) e ignora conflitos — se 2 requests
// concorrentes tentarem inserir, a 2a falha silenciosa e a 1a ganha.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) return { mes: 12, ano: ano - 1 }
  return { mes: mes - 1, ano }
}

/**
 * Garante que exista campanha (com servicos e premios) pra (mes, ano).
 * Se ja existe, no-op. Se nao existe mas o mes anterior tem, copia tudo.
 * Se nem o mes anterior tem, no-op (nada pra copiar).
 */
export async function garantirCampanhaCicloAtual(
  supabase: Supa,
  barbearia_id: string,
  mes: number,
  ano: number,
): Promise<void> {
  // 1. Ja existe campanha nesse ciclo? sai.
  const { data: existe } = await (supabase as Supa)
    .from('campanha').select('id')
    .eq('barbearia_id', barbearia_id).eq('mes', mes).eq('ano', ano)
    .maybeSingle()
  if (existe) {
    await copiarModoMesSePreciso(supabase, barbearia_id, mes, ano)
    return
  }

  // 2. Busca campanha do ciclo anterior
  const ant = mesAnterior(mes, ano)
  const { data: anteriorCamp } = await (supabase as Supa)
    .from('campanha').select('*')
    .eq('barbearia_id', barbearia_id).eq('mes', ant.mes).eq('ano', ant.ano)
    .maybeSingle()
  if (!anteriorCamp) return

  // 3. Cria nova campanha copiando a config
  const { data: nova, error: errCamp } = await (supabase as Supa)
    .from('campanha').insert({
      barbearia_id,
      mes, ano,
      min_pontos: anteriorCamp.min_pontos,
      min_pontos_recep: anteriorCamp.min_pontos_recep,
      bonus_assin_qtd: anteriorCamp.bonus_assin_qtd,
      bonus_assin_valor: anteriorCamp.bonus_assin_valor,
      regras_personalizadas: anteriorCamp.regras_personalizadas,
      quem_lanca: anteriorCamp.quem_lanca,
      ativo: anteriorCamp.ativo ?? true,
    })
    .select('id').single()

  if (errCamp || !nova) return // race ou constraint — outra request criou primeiro

  // 4. Copia servicos
  const { data: servicosAnt } = await (supabase as Supa)
    .from('campanha_servicos')
    .select('emoji, nome, pontos, conta_como_assinatura')
    .eq('campanha_id', anteriorCamp.id)

  const servicos = (servicosAnt ?? []) as Array<{
    emoji: string; nome: string; pontos: number; conta_como_assinatura: boolean | null
  }>
  if (servicos.length > 0) {
    await (supabase as Supa).from('campanha_servicos').insert(
      servicos.map(s => ({ campanha_id: nova.id, ...s }))
    )
  }

  // 5. Copia premios
  const { data: premiosAnt } = await (supabase as Supa)
    .from('campanha_premios').select('posicao, valor')
    .eq('campanha_id', anteriorCamp.id)

  const premios = (premiosAnt ?? []) as Array<{ posicao: number; valor: number }>
  if (premios.length > 0) {
    await (supabase as Supa).from('campanha_premios').insert(
      premios.map(p => ({ campanha_id: nova.id, ...p }))
    )
  }

  // 6. Garante modo_mes tambem (pra campanha efetivamente aparecer no dashboard)
  await copiarModoMesSePreciso(supabase, barbearia_id, mes, ano)
}

async function copiarModoMesSePreciso(
  supabase: Supa,
  barbearia_id: string,
  mes: number,
  ano: number,
): Promise<void> {
  const { data: existe } = await (supabase as Supa)
    .from('modo_mes').select('modo')
    .eq('barbearia_id', barbearia_id).eq('mes', mes).eq('ano', ano)
    .maybeSingle()
  if (existe) return

  const ant = mesAnterior(mes, ano)
  const { data: anterior } = await (supabase as Supa)
    .from('modo_mes').select('modo')
    .eq('barbearia_id', barbearia_id).eq('mes', ant.mes).eq('ano', ant.ano)
    .maybeSingle()
  if (!anterior) return

  await (supabase as Supa)
    .from('modo_mes')
    .insert({ barbearia_id, mes, ano, modo: anterior.modo })
}
