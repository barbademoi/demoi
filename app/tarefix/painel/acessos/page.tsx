import { notFound } from 'next/navigation'
import { exigirDono } from '@/lib/tarefix/dono'
import { ehAdmin, listarAcessos } from '@/lib/tarefix/acessos'
import { Titulo } from '@/components/tarefix/ui'
import { GerenciarAcessos } from './GerenciarAcessos'

export const metadata = { title: 'Acessos' }

export default async function Acessos() {
  const { userId, empresa } = await exigirDono()
  if (!(await ehAdmin(userId))) notFound()
  const lista = await listarAcessos(empresa.id)
  return (
    <>
      <Titulo>Acessos de mentorados</Titulo>
      <p className="-mt-3 mb-5 text-tf-suave">Cada mentorado ganha a própria empresa no Tarefix: vê só a equipe e os dados dele.</p>
      <GerenciarAcessos lista={lista} />
    </>
  )
}
