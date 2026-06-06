import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { FormCriarSenha } from './FormCriarSenha'
import { ErroPage } from './ErroPage'

export const metadata: Metadata = {
  title: 'Bem-vindo à Bússola',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { email?: string; transaction?: string }
}

export default async function BoasVindasPage({ searchParams }: Props) {
  const email = searchParams.email?.toLowerCase().trim()
  const transaction = searchParams.transaction?.trim()

  if (!email || !transaction) {
    return <ErroPage motivo="parametros_faltando" />
  }

  const admin = createAdminClient()

  const { data: compra } = await admin
    .from('compras_hotmart')
    .select('usuario_id, status, email_comprador')
    .eq('transaction_id', transaction)
    .eq('email_comprador', email)
    .maybeSingle()

  if (!compra) {
    return <ErroPage motivo="compra_nao_encontrada" email={email} />
  }
  if (compra.status === 'refunded' || compra.status === 'canceled') {
    return <ErroPage motivo="compra_cancelada" />
  }
  if (compra.status !== 'approved' || !compra.usuario_id) {
    return <ErroPage motivo="compra_pendente" />
  }

  // Já criou senha? Manda pra login.
  const { data: userResp } = await admin.auth.admin.getUserById(compra.usuario_id)
  const appMeta = (userResp?.user?.app_metadata ?? {}) as Record<string, unknown>
  if (appMeta.senha_definida === true) {
    redirect('/entrar?msg=ja_tem_senha')
  }

  return <FormCriarSenha email={email} transactionId={transaction} />
}
