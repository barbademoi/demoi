'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.barbermeta.com.br'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL  ?? 'onboarding@resend.dev'

async function enviarEmailBoasVindas(
  email: string,
  nome: string,
  paymentId?: string,
  valor?: number,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const primeiroNome = nome.split(' ')[0]
  const dataCompra = new Date().toLocaleDateString('pt-BR')

  await resend.emails.send({
    from:    `BarberMeta <${FROM_EMAIL}>`,
    to:      email,
    subject: 'Bem-vindo ao BarberMeta — seu acesso está pronto!',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Segoe UI',sans-serif;color:#e8e0d0;">
  <div style="max-width:520px;margin:40px auto;background:#141720;border-radius:16px;overflow:hidden;border:1px solid #2a2d38;">

    <div style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2a2d38;">
      <h1 style="margin:0;font-size:28px;color:#e8e0d0;font-weight:400;">
        Barber<span style="color:#c5a028;">Meta</span>
      </h1>
      <p style="margin:8px 0 0;color:#8b8fa8;font-size:13px;">Gestão de metas para barbearias</p>
    </div>

    <div style="padding:36px 40px;">
      <p style="margin:0 0 6px;color:#8b8fa8;font-size:13px;">Olá, ${primeiroNome}!</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:400;color:#e8e0d0;">
        Sua conta foi criada com sucesso. 🎉
      </h2>

      <a href="${APP_URL}" style="display:block;text-align:center;background:#c5a028;color:#0d0f14;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:28px;">
        Acessar o BarberMeta →
      </a>

      <a href="${APP_URL}/treinamentos" style="display:block;text-align:center;background:transparent;color:#c5a028;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500;margin-bottom:28px;border:1px solid #c5a02840;">
        Ver treinamentos em vídeo →
      </a>

      ${paymentId || valor ? `
      <div style="background:#0d0f14;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #2a2d38;">
        <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#8b8fa8;">Dados da compra</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:12px;color:#8b8fa8;padding:3px 0;">Data</td>
            <td style="font-size:12px;color:#e8e0d0;text-align:right;">${dataCompra}</td>
          </tr>
          ${valor ? `<tr>
            <td style="font-size:12px;color:#8b8fa8;padding:3px 0;">Valor</td>
            <td style="font-size:12px;color:#e8e0d0;text-align:right;">R$ ${valor.toFixed(2)}</td>
          </tr>` : ''}
          ${paymentId ? `<tr>
            <td style="font-size:12px;color:#8b8fa8;padding:3px 0;">ID transação</td>
            <td style="font-size:12px;color:#e8e0d0;text-align:right;font-family:monospace;">${paymentId}</td>
          </tr>` : ''}
        </table>
      </div>` : ''}

      <p style="margin:0;font-size:12px;color:#8b8fa8;line-height:1.6;">
        Dúvidas? Responda este email ou escreva para
        <a href="mailto:suporte@barbermeta.com.br" style="color:#c5a028;">suporte@barbermeta.com.br</a>
      </p>
    </div>

    <div style="padding:16px 40px;border-top:1px solid #2a2d38;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4a4d5e;">
        © ${new Date().getFullYear()} BarberMeta · Cássia / MG
      </p>
    </div>
  </div>
</body>
</html>`.trim(),
  })
}

// ── Fluxo Mercado Pago ────────────────────────────────────────────────────────
export async function definirSenhaMP(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const externalRef = (formData.get('external_reference') as string ?? '').trim()
  const novaSenha   = (formData.get('nova_senha')         as string ?? '')
  const confirmar   = (formData.get('confirmar_senha')    as string ?? '')

  if (!externalRef)             return { error: 'Link inválido.' }
  if (novaSenha.length < 8)     return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  if (novaSenha !== confirmar)   return { error: 'As senhas não conferem.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: compra } = await (admin as any)
    .from('compras_pendentes')
    .select('email, nome, usuario_id, mp_payment_id, valor, status')
    .eq('id', externalRef)
    .maybeSingle()

  if (!compra)                             return { error: 'Link inválido ou expirado.' }
  if (compra.status !== 'approved')        return { error: 'Pagamento ainda não confirmado.' }
  if (!compra.usuario_id)                  return { error: 'Conta ainda sendo criada. Aguarde e tente novamente.' }

  const { data: usuario } = await admin.auth.admin.getUserById(compra.usuario_id)
  if (!usuario?.user) return { error: 'Usuário não encontrado.' }

  // Verifica se senha já foi definida
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRow } = await (admin as any)
    .from('usuarios')
    .select('senha_definida')
    .eq('id', compra.usuario_id)
    .single()

  if (usuarioRow?.senha_definida) return { error: 'Senha já foi definida. Use o login.' }

  const { error: errAuth } = await admin.auth.admin.updateUserById(compra.usuario_id, {
    password: novaSenha,
  })
  if (errAuth) return { error: 'Erro ao definir senha. Tente novamente.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('usuarios')
    .update({ senha_definida: true })
    .eq('id', compra.usuario_id)

  const supabase = createClient()
  const { error: errLogin } = await supabase.auth.signInWithPassword({
    email:    compra.email,
    password: novaSenha,
  })
  if (errLogin) redirect('/login?msg=senha_criada')

  // Envia email único de boas-vindas
  try {
    await enviarEmailBoasVindas(compra.email, compra.nome, compra.mp_payment_id, compra.valor)
  } catch (err) {
    console.error('[boas-vindas/mp] erro ao enviar email:', err)
  }

  cookies().set('onboarding_required', '1', { path: '/', httpOnly: true, sameSite: 'lax' })
  redirect('/onboarding/passo-1')
}

// ── Fluxo Hotmart (legado — 30 dias) ─────────────────────────────────────────
export async function definirSenha(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email       = (formData.get('email')               as string ?? '').toLowerCase().trim()
  const transaction = (formData.get('hotmart_transaction') as string ?? '').trim()
  const novaSenha   = (formData.get('nova_senha')          as string ?? '')
  const confirmar   = (formData.get('confirmar_senha')     as string ?? '')

  if (!email || !transaction) return { error: 'Link inválido.' }
  if (novaSenha.length < 8)   return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  if (novaSenha !== confirmar) return { error: 'As senhas não conferem.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (admin as any)
    .from('usuarios')
    .select('id, senha_definida')
    .eq('email', email)
    .eq('hotmart_transaction', transaction)
    .maybeSingle()

  if (!usuario) return { error: 'Link inválido ou expirado.' }
  if (usuario.senha_definida) return { error: 'Senha já foi definida. Use o login.' }

  const { error: errAuth } = await admin.auth.admin.updateUserById(usuario.id, {
    password: novaSenha,
  })
  if (errAuth) return { error: 'Erro ao definir senha. Tente novamente.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('usuarios')
    .update({ senha_definida: true })
    .eq('id', usuario.id)

  const supabase = createClient()
  const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password: novaSenha })
  if (errLogin) redirect('/login?msg=senha_criada')

  cookies().set('onboarding_required', '1', { path: '/', httpOnly: true, sameSite: 'lax' })
  redirect('/onboarding/passo-1')
}
