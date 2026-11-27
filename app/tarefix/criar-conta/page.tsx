import { redirect } from 'next/navigation'
import { sessaoDono } from '@/lib/tarefix/dono'

export const dynamic = 'force-dynamic'

// O cadastro grátis foi fechado: o Tarefix é vendido pela página de compra
// (e o admin concede acessos pelo painel). Quem já tem conta segue normal.
export default async function CriarConta() {
  const s = await sessaoDono()
  if (s === 'sem-acesso') redirect('/tarefix/sem-acesso')
  if (s === 'suspenso') redirect('/tarefix/sem-acesso?motivo=suspenso')
  if (s !== 'sem-login') redirect('/tarefix/painel')
  redirect('/tarefix/comprar')
}
