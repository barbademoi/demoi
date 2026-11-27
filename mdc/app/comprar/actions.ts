'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { digitos } from '@/lib/format'
import { planoValido } from '@/lib/planos'
import { lerConfig } from '@/lib/settings'
import { TERMO_PADRAO } from '@/lib/defaults'

export type ResultadoConta = { ok: true } | { ok: false; erros: Record<string, string>; mensagem?: string; jaExiste?: boolean }

export async function criarConta(fd: FormData): Promise<ResultadoConta> {
  const plano = String(fd.get('plano') ?? '')
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 120)
  const email = String(fd.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const senha = String(fd.get('senha') ?? '')
  const whatsapp = digitos(String(fd.get('whatsapp') ?? ''))
  const aceite = fd.get('aceite') === 'on'

  const erros: Record<string, string> = {}
  if (!planoValido(plano)) erros.plano = 'Escolhe um plano.'
  if (nome.length < 2) erros.nome = 'Coloca seu nome.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = 'E-mail inválido.'
  if (senha.length < 8) erros.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  if (whatsapp.length < 10 || whatsapp.length > 11) erros.whatsapp = 'Coloca o WhatsApp com DDD.'
  if (!aceite) erros.aceite = 'Precisa aceitar o termo de adesão.'
  if (Object.keys(erros).length) return { ok: false, erros }

  const admin = createAdminClient()
  const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })
  if (erroCriar || !criado.user) {
    const existe = /already|registered|exists/i.test(erroCriar?.message ?? '')
    return existe
      ? { ok: false, erros: { email: 'Esse e-mail já tem conta.' }, jaExiste: true, mensagem: 'Esse e-mail já tem conta. Entre para continuar.' }
      : { ok: false, erros: {}, mensagem: 'Não deu pra criar a conta agora. Tenta de novo.' }
  }
  const uid = criado.user.id

  const { error: erroMembro } = await admin.from('members').insert({ id: uid, nome, email, whatsapp, plano, status: 'pendente' })
  if (erroMembro) {
    await admin.auth.admin.deleteUser(uid)
    return { ok: false, erros: {}, mensagem: 'Não deu pra criar a conta agora. Tenta de novo.' }
  }

  const termo = await lerConfig('termo', TERMO_PADRAO)
  const h = headers()
  await admin.from('terms_acceptances').insert({
    member_id: uid,
    versao: termo.versao,
    ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
    user_agent: (h.get('user-agent') ?? '').slice(0, 300) || null,
  })

  const supabase = createClient()
  await supabase.auth.signInWithPassword({ email, password: senha })
  return { ok: true }
}
