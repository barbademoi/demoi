import { createAdminClient } from '@/utils/supabase/admin'
import { EntrarForm } from './EntrarForm'
import { PreFilledForm } from './PreFilledForm'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { email?: string; t?: string; msg?: string }
}

// Server component: detecta ?email=&t= (vindo da página de obrigado da
// Hotmart) e tenta resgatar a senha temporária da compra. Se OK e ainda
// não foi definida, mostra banner verde com senha pré-preenchida.
// Caso contrário cai no form normal.
export default async function EntrarPage({ searchParams }: Props) {
  const email = searchParams.email?.toLowerCase().trim()
  const transaction = searchParams.t?.trim()

  // Sem params → form normal
  if (!email || !transaction) {
    return <EntrarForm msg={searchParams.msg} />
  }

  const admin = createAdminClient()

  const { data: compra } = await admin
    .from('compras_hotmart')
    .select('senha_temporaria, status, usuario_id')
    .eq('transaction_id', transaction)
    .eq('email_comprador', email)
    .maybeSingle()

  // Compra inexistente ou cancelada → cai no form normal silenciosamente
  if (!compra || compra.status !== 'approved' || !compra.usuario_id) {
    return <EntrarForm msg={searchParams.msg} />
  }

  // Sem senha temp = cliente já criou definitiva. Form normal com aviso.
  if (!compra.senha_temporaria) {
    return <EntrarForm msg="ja_tem_senha" />
  }

  // Confirma no auth que senha_definida ainda é false (defesa extra)
  const { data: userResp } = await admin.auth.admin.getUserById(compra.usuario_id)
  const appMeta = (userResp?.user?.app_metadata ?? {}) as Record<string, unknown>
  if (appMeta.senha_definida === true) {
    return <EntrarForm msg="ja_tem_senha" />
  }

  return <PreFilledForm email={email} senhaTemporaria={compra.senha_temporaria} />
}
