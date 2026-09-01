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

interface PeriodoCampanha {
  mes: number
  ano: number
}

export type ResultadoCopiaCampanha =
  | { ok: true; campanhaId: string }
  | { ok: false; motivo: 'origem_nao_encontrada' | 'destino_existente' | 'erro'; erro?: string }

function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) return { mes: 12, ano: ano - 1 }
  return { mes: mes - 1, ano }
}

export function mesSeguinte(mes: number, ano: number): PeriodoCampanha {
  if (mes === 12) return { mes: 1, ano: ano + 1 }
  return { mes: mes + 1, ano }
}

/**
 * Copia uma campanha completa entre dois ciclos da mesma barbearia.
 *
 * O destino nunca e sobrescrito: se ja existir, a operacao para sem alterar
 * nada. Servicos, premios e modo do mes seguem a configuracao de origem.
 */
export async function copiarCampanhaEntreCiclos(
  supabase: Supa,
  barbearia_id: string,
  origem: PeriodoCampanha,
  destino: PeriodoCampanha,
): Promise<ResultadoCopiaCampanha> {
  const { data: anteriorCamp, error: erroOrigem } = await (supabase as Supa)
    .from('campanha')
    .select('id, min_pontos, min_pontos_recep, bonus_assin_qtd, bonus_assin_valor, regras_personalizadas, quem_lanca, ativo')
    .eq('barbearia_id', barbearia_id)
    .eq('mes', origem.mes)
    .eq('ano', origem.ano)
    .maybeSingle()

  if (erroOrigem) {
    return { ok: false, motivo: 'erro', erro: erroOrigem.message }
  }
  if (!anteriorCamp) {
    return { ok: false, motivo: 'origem_nao_encontrada' }
  }

  const { data: existente, error: erroDestino } = await (supabase as Supa)
    .from('campanha')
    .select('id')
    .eq('barbearia_id', barbearia_id)
    .eq('mes', destino.mes)
    .eq('ano', destino.ano)
    .maybeSingle()

  if (erroDestino) {
    return { ok: false, motivo: 'erro', erro: erroDestino.message }
  }
  if (existente) {
    return { ok: false, motivo: 'destino_existente' }
  }

  const { data: nova, error: errCamp } = await (supabase as Supa)
    .from('campanha')
    .insert({
      barbearia_id,
      mes: destino.mes,
      ano: destino.ano,
      min_pontos: anteriorCamp.min_pontos,
      min_pontos_recep: anteriorCamp.min_pontos_recep,
      bonus_assin_qtd: anteriorCamp.bonus_assin_qtd,
      bonus_assin_valor: anteriorCamp.bonus_assin_valor,
      regras_personalizadas: anteriorCamp.regras_personalizadas,
      quem_lanca: anteriorCamp.quem_lanca,
      ativo: anteriorCamp.ativo ?? true,
    })
    .select('id')
    .single()

  if (errCamp || !nova) {
    // Uma requisicao concorrente pode ter criado o destino entre a consulta
    // e o insert. Nesse caso, mantemos o destino intacto e avisamos a UI.
    if (errCamp?.code === '23505') {
      return { ok: false, motivo: 'destino_existente' }
    }
    return { ok: false, motivo: 'erro', erro: errCamp?.message ?? 'Não foi possível criar a campanha.' }
  }

  const desfazerCampanha = async () => {
    await (supabase as Supa).from('campanha').delete().eq('id', nova.id).eq('barbearia_id', barbearia_id)
  }

  const { data: servicosAnt, error: erroServicosLeitura } = await (supabase as Supa)
    .from('campanha_servicos')
    .select('emoji, nome, pontos, conta_como_assinatura, eh_servico_feedback')
    .eq('campanha_id', anteriorCamp.id)

  if (erroServicosLeitura) {
    await desfazerCampanha()
    return { ok: false, motivo: 'erro', erro: erroServicosLeitura.message }
  }

  const servicos = (servicosAnt ?? []) as Array<{
    emoji: string
    nome: string
    pontos: number
    conta_como_assinatura: boolean | null
    eh_servico_feedback: boolean | null
  }>
  if (servicos.length > 0) {
    const { error: erroServicos } = await (supabase as Supa).from('campanha_servicos').insert(
      servicos.map(s => ({
        campanha_id: nova.id,
        ...s,
        conta_como_assinatura: !!s.conta_como_assinatura,
        eh_servico_feedback: !!s.eh_servico_feedback,
      }))
    )
    if (erroServicos) {
      await desfazerCampanha()
      return { ok: false, motivo: 'erro', erro: erroServicos.message }
    }
  }

  const { data: premiosAnt, error: erroPremiosLeitura } = await (supabase as Supa)
    .from('campanha_premios')
    .select('posicao, valor')
    .eq('campanha_id', anteriorCamp.id)

  if (erroPremiosLeitura) {
    await desfazerCampanha()
    return { ok: false, motivo: 'erro', erro: erroPremiosLeitura.message }
  }

  const premios = (premiosAnt ?? []) as Array<{ posicao: number; valor: number }>
  if (premios.length > 0) {
    const { error: erroPremios } = await (supabase as Supa).from('campanha_premios').insert(
      premios.map(p => ({ campanha_id: nova.id, ...p }))
    )
    if (erroPremios) {
      await desfazerCampanha()
      return { ok: false, motivo: 'erro', erro: erroPremios.message }
    }
  }

  const modoCopiado = await copiarModoEntreCiclosSePreciso(
    supabase,
    barbearia_id,
    origem,
    destino,
  )
  if (!modoCopiado.ok) {
    await desfazerCampanha()
    return modoCopiado
  }

  return { ok: true, campanhaId: nova.id }
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
  await copiarCampanhaEntreCiclos(supabase, barbearia_id, ant, { mes, ano })
}

async function copiarModoEntreCiclosSePreciso(
  supabase: Supa,
  barbearia_id: string,
  origem: PeriodoCampanha,
  destino: PeriodoCampanha,
): Promise<{ ok: true } | { ok: false; motivo: 'erro'; erro: string }> {
  const { data: existe, error: erroDestino } = await (supabase as Supa)
    .from('modo_mes').select('modo')
    .eq('barbearia_id', barbearia_id).eq('mes', destino.mes).eq('ano', destino.ano)
    .maybeSingle()
  if (erroDestino) return { ok: false, motivo: 'erro', erro: erroDestino.message }
  if (existe) return { ok: true }

  const { data: anterior, error: erroOrigem } = await (supabase as Supa)
    .from('modo_mes').select('modo')
    .eq('barbearia_id', barbearia_id).eq('mes', origem.mes).eq('ano', origem.ano)
    .maybeSingle()
  if (erroOrigem) return { ok: false, motivo: 'erro', erro: erroOrigem.message }
  if (!anterior) return { ok: true }

  const { error: erroInsert } = await (supabase as Supa)
    .from('modo_mes')
    .insert({ barbearia_id, mes: destino.mes, ano: destino.ano, modo: anterior.modo })
  if (erroInsert && erroInsert.code !== '23505') {
    return { ok: false, motivo: 'erro', erro: erroInsert.message }
  }
  return { ok: true }
}

async function copiarModoMesSePreciso(
  supabase: Supa,
  barbearia_id: string,
  mes: number,
  ano: number,
): Promise<void> {
  const ant = mesAnterior(mes, ano)
  await copiarModoEntreCiclosSePreciso(supabase, barbearia_id, ant, { mes, ano })
}
