'use server'

import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { createTarefixServer } from '@/lib/tarefix/supabase/server'
import { criarEmpresaEDono, dentroDoLimite, type Uso } from '@/lib/tarefix/cadastro'
import { ehClienteBarbermeta } from '@/lib/tarefixModulo/clienteBarbermeta'

type Resposta = { ok: true; destino: string } | { ok: false; erro: string; jaTemConta?: boolean }

const destino = (uso: Uso) => (uso === 'pessoal' ? '/tarefix/painel/meu-dia' : '/tarefix/painel')

function nomeEmpresa(uso: Uso, nome: string, empresa: string) {
  const e = empresa.trim().slice(0, 80)
  if (e) return e
  return uso === 'pessoal' ? `Tarefas de ${nome.split(' ')[0]}` : `Empresa de ${nome.split(' ')[0]}`
}

/** Cadastro público: cria a conta (só Tarefix), a empresa e o dono. O navegador entra logo depois. */
export async function criarConta(d: { nome: string; email: string; senha: string; empresa: string; uso: Uso; site?: string }): Promise<Resposta> {
  if (d.site) return { ok: false, erro: 'Não foi possível criar a conta.' } // campo-isca para robôs
  const nome = d.nome.trim().slice(0, 80)
  const email = d.email.trim().toLowerCase()
  const uso: Uso = d.uso === 'equipe' ? 'equipe' : 'pessoal'
  if (nome.length < 2) return { ok: false, erro: 'Diga o seu nome.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, erro: 'E-mail inválido.' }
  if (d.senha.length < 8) return { ok: false, erro: 'A senha precisa de pelo menos 8 caracteres.' }

  const db = createTarefixAdmin()
  if (!(await dentroDoLimite(db))) return { ok: false, erro: 'Muitos cadastros seguidos daqui. Tente de novo mais tarde.' }

  const { data: criado, error } = await db.auth.admin.createUser({
    email,
    password: d.senha,
    email_confirm: true,
    user_metadata: { nome },
    app_metadata: { tarefix_only: true },
  })
  if (error || !criado.user) {
    if (/already|registered|exists/i.test(error?.message ?? '')) {
      return { ok: false, jaTemConta: true, erro: 'Este e-mail já tem conta. Entre com ela. Se for cliente do BarberMeta, o Tarefix fica no menu do BarberMeta.' }
    }
    return { ok: false, erro: 'Não consegui criar a conta agora. Tente de novo.' }
  }
  const r = await criarEmpresaEDono(db, { userId: criado.user.id, nome, email, empresa: nomeEmpresa(uso, nome, d.empresa) })
  if (!r.ok) {
    await db.auth.admin.deleteUser(criado.user.id)
    return { ok: false, erro: r.erro }
  }
  return { ok: true, destino: destino(uso) }
}

/** Quem já tem conta (ex.: BarberMeta) e entrou: cria o próprio Tarefix. */
export async function criarMeuTarefix(d: { empresa: string; uso: Uso }): Promise<Resposta> {
  const { data: { user } } = await createTarefixServer().auth.getUser()
  if (!user?.email) return { ok: false, erro: 'Entre na sua conta primeiro.' }
  const db = createTarefixAdmin()
  const { data: ja } = await db.from('donos').select('id').eq('id', user.id).maybeSingle()
  const uso: Uso = d.uso === 'equipe' ? 'equipe' : 'pessoal'
  if (ja) return { ok: true, destino: destino(uso) }
  // cliente do BarberMeta: o Tarefix é módulo pago, comprado dentro do BarberMeta
  if (await ehClienteBarbermeta(user.id)) return { ok: false, erro: 'Para clientes do BarberMeta, o Tarefix é liberado pelo menu Tarefix do BarberMeta.' }
  const nome = String(user.user_metadata?.nome ?? user.user_metadata?.name ?? user.email.split('@')[0]).slice(0, 80)
  const r = await criarEmpresaEDono(db, { userId: user.id, nome, email: user.email, empresa: nomeEmpresa(uso, nome, d.empresa) })
  return r.ok ? { ok: true, destino: destino(uso) } : { ok: false, erro: r.erro }
}
