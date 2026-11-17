import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import type { Colaborador, ConfigPessoal, Dono, Empresa } from '@/lib/tarefix/tipos'

/**
 * Meu dia: o dono usa o Tarefix para si mesmo através de um "colaborador"
 * especial (eh_dono = true, dono_id = ele). Assim reaproveita tarefas,
 * termômetro, mês, fotos e notificações. Esse colaborador não tem PIN:
 * só abre com o login do próprio dono, e não aparece nas telas da equipe.
 */

export const PESSOAL_PADRAO: ConfigPessoal = { antes_min: 15, na_hora: true, insistente: true, manha: '07:00', noite: '21:00', passar_para_amanha: true }

export function configPessoal(e: Pick<Empresa, 'pessoal'>): ConfigPessoal {
  const c = (e.pessoal ?? {}) as Partial<ConfigPessoal>
  return {
    antes_min: [0, 5, 10, 15, 30, 60].includes(Number(c.antes_min)) ? Number(c.antes_min) : PESSOAL_PADRAO.antes_min,
    na_hora: typeof c.na_hora === 'boolean' ? c.na_hora : PESSOAL_PADRAO.na_hora,
    insistente: typeof c.insistente === 'boolean' ? c.insistente : PESSOAL_PADRAO.insistente,
    manha: c.manha === null ? null : /^\d\d:\d\d$/.test(c.manha ?? '') ? c.manha! : PESSOAL_PADRAO.manha,
    noite: c.noite === null ? null : /^\d\d:\d\d$/.test(c.noite ?? '') ? c.noite! : PESSOAL_PADRAO.noite,
    passar_para_amanha: typeof c.passar_para_amanha === 'boolean' ? c.passar_para_amanha : PESSOAL_PADRAO.passar_para_amanha,
  }
}

/**
 * No Meu dia o dia vai até 23:59 (não existe "fora do horário" para si mesmo)
 * e as tarefas do dia todo liberam a confirmação a partir das 18h.
 */
export function empresaPessoal(e: Empresa): Empresa {
  return { ...e, horario_fechamento: '23:59:00', liberar_continuas_min: 6 * 60 - 1 }
}

export const CATEGORIAS_PADRAO = [
  { nome: 'Barbearia', cor: '#5B3DF5' },
  { nome: 'Pessoal', cor: '#0E9F6E' },
  { nome: 'Saúde', cor: '#E02424' },
  { nome: 'Finanças', cor: '#C27803' },
]

/** Encontra (ou cria) o colaborador do Meu dia do dono. */
export async function garantirEu(dono: Dono, empresa: Empresa, db = createTarefixAdmin()): Promise<Colaborador> {
  const { data: atual } = await db.from('colaboradores').select('*').eq('dono_id', dono.id).eq('eh_dono', true).maybeSingle()
  if (atual) {
    if (!atual.ativo) await db.from('colaboradores').update({ ativo: true }).eq('id', atual.id)
    return { ...(atual as Colaborador), ativo: true }
  }
  const { data: novo, error } = await db
    .from('colaboradores')
    .insert({ empresa_id: empresa.id, nome: dono.nome, eh_dono: true, dono_id: dono.id, ativo: true })
    .select('*')
    .single()
  if (error || !novo) {
    // corrida: outra aba criou ao mesmo tempo
    const { data: outra } = await db.from('colaboradores').select('*').eq('dono_id', dono.id).eq('eh_dono', true).single()
    return outra as Colaborador
  }
  // primeiras categorias da empresa
  const { count } = await db.from('categorias').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa.id)
  if (!count) await db.from('categorias').insert(CATEGORIAS_PADRAO.map((c, i) => ({ ...c, empresa_id: empresa.id, ordem: i })))
  return novo as Colaborador
}

/** Equipe "de verdade" (sem o colaborador do Meu dia). */
export async function contarEquipe(empresaId: string, db = createTarefixAdmin()): Promise<number> {
  const { count } = await db.from('colaboradores').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('ativo', true).eq('eh_dono', false)
  return count ?? 0
}
