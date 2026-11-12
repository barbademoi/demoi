import { exigirDono } from '@/lib/tarefix/dono'
import type { Aviso } from '@/lib/tarefix/tipos'
import { Titulo, Vazio } from '@/components/tarefix/ui'
import { ListaAvisos } from './ListaAvisos'

export const metadata = { title: 'Avisos' }

export default async function Avisos() {
  const { db } = await exigirDono()
  const { data } = await db.from('avisos').select('*').order('criado_em', { ascending: false }).limit(60)
  const avisos = (data ?? []) as Aviso[]
  return (
    <>
      <Titulo>Avisos</Titulo>
      {avisos.length === 0 ? (
        <Vazio titulo="Nenhum aviso ainda" texto="Aqui aparecem o resumo de cada fechamento, fotos enviadas e extras para aprovar." />
      ) : (
        <ListaAvisos avisos={avisos} />
      )}
    </>
  )
}
