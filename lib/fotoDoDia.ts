/**
 * FOTO DIÁRIA DO ACUMULADO — a memória que o sistema não tinha.
 *
 * ── O BURACO ────────────────────────────────────────────────────────────────
 * `lancamentos` guarda UM número por barbeiro por ciclo, e ele é sobrescrito.
 * Quando o mês acaba, ninguém sabe mais como ele subiu: se o movimento se
 * concentrou na primeira quinzena ou na última, se houve uma semana parada.
 * Essa forma é justamente o que uma projeção precisa saber, e ela estava
 * sendo jogada fora todo dia.
 *
 * As comandas diárias ajudam, mas são um proxy torto: um corte de R$ 30 e um
 * de R$ 120 contam igual. E só existem para quem lança comandas.
 *
 * ── O QUE ISTO FAZ ──────────────────────────────────────────────────────────
 * Toda vez que o acumulado de um barbeiro muda, grava o valor do dia em
 * `lancamentos_diarios.valor` — a coluna existe desde a migration 005 e até
 * agora só a extensão do Agenda Serviço preenchia. Sem tabela nova, sem o
 * dono fazer nada, sem alterar nenhum número que já esteja gravado.
 *
 * A partir daí, cada ciclo deixa um registro de COMO ele subiu, e a projeção
 * passa a ler dinheiro de verdade em vez de contar comandas.
 *
 * ── CUIDADOS QUE DEFINEM O FORMATO ──────────────────────────────────────────
 *   - É FOTO, não lançamento: grava o acumulado daquele instante, não o
 *     valor do dia. Reescrever o mesmo dia é idempotente.
 *   - Só fotografa HOJE, e só se hoje estiver dentro do ciclo sendo escrito.
 *     Editar o acumulado de agosto em outubro não pode inventar um ponto na
 *     curva de agosto num dia que já passou.
 *   - NUNCA derruba uma foto existente para um valor menor. A curva de
 *     acumulado não desce; um ajuste para baixo no meio do dia apagaria o
 *     pico real.
 *   - Falhar aqui não pode derrubar o lançamento. A foto é memória para o
 *     futuro; o acumulado é o dado do presente e já foi gravado.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

export interface FotoBarbeiro {
  barbeiroId: string
  /** Acumulado do ciclo DEPOIS da gravação (R$). */
  acumulado: number
}

/** 'YYYY-MM-DD' de uma data já resolvida no fuso de São Paulo. */
export function diaIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Hoje cai dentro deste ciclo? Só então a foto faz sentido. */
export function dentroDoCiclo(hojeIso: string, inicioIso: string, fimIso: string): boolean {
  return hojeIso >= inicioIso && hojeIso <= fimIso
}

/**
 * Decide o que gravar: só sobe, nunca desce, e só quem mudou.
 * Pura — o teste exercita a regra sem banco.
 */
export function fotosParaGravar(
  fotos: FotoBarbeiro[],
  existentes: Map<string, number>,
): FotoBarbeiro[] {
  return fotos.filter((f) => {
    if (!(f.acumulado > 0)) return false
    const ja = existentes.get(f.barbeiroId)
    return ja == null || f.acumulado > ja
  })
}

export async function registrarFotoDoDia(
  supabase: Supa,
  opts: {
    barbeariaId: string
    /** Hoje, em America/Sao_Paulo. */
    hoje: Date
    /** Ciclo que está sendo escrito. */
    cicloInicioIso: string
    cicloFimIso: string
    fotos: FotoBarbeiro[]
  },
): Promise<void> {
  try {
    const hojeIso = diaIso(opts.hoje)
    if (!dentroDoCiclo(hojeIso, opts.cicloInicioIso, opts.cicloFimIso)) return
    if (opts.fotos.length === 0) return

    const ids = opts.fotos.map((f) => f.barbeiroId)
    const { data } = await supabase
      .from('lancamentos_diarios')
      .select('barbeiro_id, valor')
      .eq('barbearia_id', opts.barbeariaId)
      .eq('data', hojeIso)
      .in('barbeiro_id', ids)

    const existentes = new Map<string, number>()
    for (const r of (data ?? []) as { barbeiro_id: string; valor: number | string | null }[]) {
      existentes.set(r.barbeiro_id, Number(r.valor) || 0)
    }

    const gravar = fotosParaGravar(opts.fotos, existentes)
    if (gravar.length === 0) return

    // Só `valor` no payload: o upsert atualiza apenas as colunas enviadas,
    // então as comandas do dia (numero_atendimentos) ficam intactas.
    await supabase.from('lancamentos_diarios').upsert(
      gravar.map((f) => ({
        barbearia_id: opts.barbeariaId,
        barbeiro_id: f.barbeiroId,
        data: hojeIso,
        valor: f.acumulado,
        atualizado_em: new Date().toISOString(),
      })),
      { onConflict: 'barbeiro_id,data' },
    )
  } catch (err) {
    // Memória para o futuro não derruba o lançamento de hoje.
    console.error('[foto-do-dia] não consegui fotografar o acumulado:', err)
  }
}
