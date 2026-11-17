import { notFound } from 'next/navigation'
import { exigirDono } from '@/lib/tarefix/dono'
import { ehAdmin } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { hojeSP } from '@/lib/tarefix/datas'
import { lerEntregas, noPrazo, proximaReuniao, type Mentorado } from '@/lib/tarefix/mentoria'
import { Titulo } from '@/components/tarefix/ui'
import { ListaMentoria, type CartaoMentorado } from './ListaMentoria'

export const metadata = { title: 'Mentoria' }
export const dynamic = 'force-dynamic'

export default async function Mentoria() {
  const { userId, empresa } = await exigirDono()
  if (!(await ehAdmin(userId))) notFound()
  const db = createTarefixAdmin()
  const { data } = await db.from('mentorados').select('*').eq('empresa_id', empresa.id).order('ativo', { ascending: false }).order('nome')
  const mentorados = (data ?? []) as Mentorado[]
  const cartoes: CartaoMentorado[] = await Promise.all(
    mentorados.map(async (m) => {
      const [entregas, reuniao] = await Promise.all([m.ativo ? lerEntregas(m.id, db) : Promise.resolve([]), proximaReuniao(m.id, db)])
      return {
        id: m.id,
        nome: m.nome,
        ativo: m.ativo,
        prazo: noPrazo(entregas),
        atrasadas: entregas.filter((e) => e.situacao === 'atrasada').length,
        aguardando: entregas.filter((e) => e.situacao === 'aguardando').length,
        reuniao: reuniao?.quando ?? null,
      }
    })
  )
  return (
    <>
      <Titulo>Mentoria</Titulo>
      <p className="-mt-3 mb-5 text-tf-suave">Missões para os seus mentorados, com prazo, prova e lembretes. Cada um recebe um link: não precisa ter conta no Tarefix.</p>
      <ListaMentoria cartoes={cartoes} hoje={hojeSP()} />
    </>
  )
}
