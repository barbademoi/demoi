'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { estadoInstalacao } from '@/lib/instalacao'

export type RespostaCriarDono = { erro: string | null }

/**
 * Cria a conta do dono + a empresa. Só funciona enquanto NÃO existe nenhum
 * dono (primeira instalação); depois disso a ação se recusa.
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
  if (!estado.bancoOk) return { erro: 'O banco ainda não foi instalado (passo 2).' }
  if (estado.temDono) return { erro: 'A instalação já foi concluída. Entre com a conta existente.' }

  const db = createAdminClient()

  // Cria o usuário (ou reaproveita se já existir com esse e-mail, atualizando a senha).
  let userId: string | null = null
  const { data: criado, error: erroCriar } = await db.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (criado?.user) {
    userId = criado.user.id
  } else {
    const { data: lista } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existente = lista?.users.find((u) => u.email?.toLowerCase() === email)
    if (!existente) return { erro: `Não consegui criar o usuário: ${erroCriar?.message ?? 'erro desconhecido'}` }
    const { error: erroSenha } = await db.auth.admin.updateUserById(existente.id, { password: senha, email_confirm: true })
    if (erroSenha) return { erro: `Não consegui atualizar o usuário: ${erroSenha.message}` }
    userId = existente.id
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

  redirect('/instalar?pronto=1')
}
