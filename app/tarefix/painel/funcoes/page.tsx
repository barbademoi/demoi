import { exigirDono } from '@/lib/tarefix/dono'
import type { Funcao } from '@/lib/tarefix/tipos'
import { ListaFuncoes } from './ListaFuncoes'

export const metadata = { title: 'Funções' }

export default async function Funcoes() {
  const { db } = await exigirDono()
  const [{ data: funcoes }, { data: colabs }] = await Promise.all([
    db.from('funcoes').select('*').order('ativo', { ascending: false }).order('nome'),
    db.from('colaboradores').select('funcao_id').eq('ativo', true),
  ])
  const contagem: Record<string, number> = {}
  for (const c of colabs ?? []) if (c.funcao_id) contagem[c.funcao_id] = (contagem[c.funcao_id] ?? 0) + 1
  return <ListaFuncoes funcoes={(funcoes ?? []) as Funcao[]} contagem={contagem} />
}
