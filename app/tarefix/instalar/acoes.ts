'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { estadoInstalacao } from '@/lib/tarefix/instalacao'

export type RespostaCriarDono = { erro: string | null }

/**
 * Cria a conta do dono + a empresa. Só funciona enquanto NÃO existe nenhum
 * dono (primeira instalação); depois disso a ação se recusa.
 *
 * O Supabase é o mesmo do BarberMeta, então o e-mail pode já ter conta lá.
 * Nesse caso a senha precisa ser a MESMA da conta existente (conferimos com
 * login) — nunca trocamos a senha de ninguém.
 */
export async function criarDono(_: RespostaCriarDono, form: FormData): Promise<RespostaCriarDono> {
  const empresa = String(form.get('empresa') ?? '').trim()
  const nome = String(form.get('nome') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const senha = String(form.get('senha') ?? '')

  if (!empresa || !nome || !email) return { erro: 'Preencha todos os campos.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erro: 'E-mail inválido.' }
  if (senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' }

  const estado = await estadoInstalacao()
  if (!estado.schemaExposto) return { erro: 'O banco ainda não está pronto (passos 2 e 3).' }
  if (estado.temDono) return { erro: 'A instalação já foi concluída.' }

  const db = createTarefixAdmin()
  let userId: string | null = null

  const { data: criado, error: erroCriar } = await db.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (criado?.user) {
    userId = criado.user.id
  } else {
    // E-mail já existe (ex.: sua conta do BarberMeta): confere a senha com um login.
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: login, error: erroLogin } = await anon.auth.signInWithPassword({ email, password: senha })
    if (erroLogin || !login.user) {
      const jaExiste = /already|registered|exists/i.test(erroCriar?.message ?? '')
      return {
        erro: jaExiste
          ? 'Esse e-mail já tem conta (por exemplo, no BarberMeta). Use a MESMA senha dessa conta.'
          : `Não consegui criar o usuário: ${erroCriar?.message ?? erroLogin?.message ?? 'erro desconhecido'}`,
      }
    }
    userId = login.user.id
    await anon.auth.signOut()
  }

  const { data: emp, error: erroEmp } = await db.from('empresas').insert({ nome: empresa }).select('id').single()
  if (erroEmp || !emp) return { erro: `Erro ao criar a empresa: ${erroEmp?.message}` }

  const { error: erroDono } = await db.from('donos').insert({ id: userId, empresa_id: emp.id, nome, email })
  if (erroDono) {
    await db.from('empresas').delete().eq('id', emp.id)
    return { erro: `Erro ao criar o dono: ${erroDono.message}` }
  }

  await db.from('bonus_config').insert({
    empresa_id: emp.id,
    ativo: false,
    mostrar_para_colaborador: true,
    niveis: [
      { percentual: 90, premio: 'R$ 50' },
      { percentual: 100, premio: 'R$ 100' },
    ],
  })

  redirect('/tarefix/instalar')
}
