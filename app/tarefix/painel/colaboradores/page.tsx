import { exigirDono } from '@/lib/tarefix/dono'
import { ListaColaboradores } from './ListaColaboradores'

export const metadata = { title: 'Equipe' }

export default async function Colaboradores() {
  const { db } = await exigirDono()
  const [{ data: colaboradores }, { data: funcoes }] = await Promise.all([
    // nunca mandar pin_hash/token para o navegador sem necessidade
    db.from('colaboradores').select('id, nome, foto_url, funcao_id, ativo').order('ativo', { ascending: false }).order('nome'),
    db.from('funcoes').select('id, nome, ativo').order('nome'),
  ])
  return <ListaColaboradores colaboradores={colaboradores ?? []} funcoes={funcoes ?? []} />
}
