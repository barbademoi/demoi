/**
 * LEITURA TOLERANTE DO CALENDÁRIO DE OPERAÇÃO.
 *
 * As colunas `dias_fechados` e `dias_abertos` chegam pela migration 060, e
 * migration em produção é aplicada à mão, no tempo do dono. Entre o deploy do
 * código e o `alter table`, existe uma janela.
 *
 * Nessa janela, pedir as colunas no `select` principal da barbearia derruba a
 * consulta INTEIRA — o PostgREST recusa a query toda por causa de uma coluna
 * que não existe — e o dashboard não carrega. Foi exatamente o que aconteceu.
 *
 * Por isso o calendário é lido à parte, numa consulta própria que pode falhar
 * sem levar nada junto: sem as colunas, devolve listas vazias, que significam
 * precisamente o comportamento anterior. Nada de página branca por causa de
 * uma configuração opcional.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

export interface ExcecoesCalendario {
  fechadosManuais: string[]
  abertosManuais: string[]
}

const VAZIO: ExcecoesCalendario = { fechadosManuais: [], abertosManuais: [] }

/** Só o que for data 'YYYY-MM-DD'; o resto é descartado em silêncio. */
function datas(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
}

export async function lerExcecoesCalendario(
  supabase: Supa,
  barbeariaId: string,
): Promise<ExcecoesCalendario> {
  try {
    const { data, error } = await supabase
      .from('barbearias')
      .select('dias_fechados, dias_abertos')
      .eq('id', barbeariaId)
      .maybeSingle()

    // Erro aqui é quase sempre "coluna não existe" — a migration ainda não
    // rodou. Não é motivo pra tela nenhuma quebrar.
    if (error || !data) return VAZIO

    return {
      fechadosManuais: datas((data as { dias_fechados?: unknown }).dias_fechados),
      abertosManuais: datas((data as { dias_abertos?: unknown }).dias_abertos),
    }
  } catch {
    return VAZIO
  }
}
