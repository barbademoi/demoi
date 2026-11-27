import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { concederAcesso } from '@/lib/tarefix/acessos'
import { limparWhatsapp } from '@/lib/tarefixModulo/config'
import { avisarAdminTarefix } from '@/lib/tarefixModulo/liberacao'

/**
 * Vendas avulsas do Tarefix (página /tarefix/comprar, divulgada no Instagram).
 * Pix conferido à mão: o pedido nasce "pendente"; o admin libera e a conta é
 * criada com senha provisória (ou ligada à conta que o e-mail já tinha).
 * Só o servidor usa este módulo.
 */

export type Venda = {
  id: string
  nome: string
  email: string
  whatsapp: string
  empresa: string
  payer_name: string | null
  status: 'pendente' | 'liberada' | 'recusada'
  motivo: string | null
  criado_em: string
  revisado_em: string | null
}

export type DadosPedido = { nome: string; email: string; whatsapp: string; empresa: string; payer?: string; site?: string }

export async function registrarPedido(d: DadosPedido, podeCadastrar: () => Promise<boolean>): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (d.site) return { ok: true } // campo-isca: robô "consegue", mas nada é gravado
  const nome = d.nome.trim().slice(0, 80)
  const email = d.email.trim().toLowerCase().slice(0, 160)
  const empresa = d.empresa.trim().slice(0, 80)
  const whatsapp = limparWhatsapp(d.whatsapp)
  const payer = (d.payer ?? '').trim().slice(0, 120)
  if (nome.length < 2) return { ok: false, erro: 'Diga o seu nome.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, erro: 'E-mail inválido.' }
  if (!whatsapp) return { ok: false, erro: 'Informe um WhatsApp válido, com DDD.' }
  if (empresa.length < 2) return { ok: false, erro: 'Informe o nome da barbearia.' }

  const db = createTarefixAdmin()
  // mesmo e-mail com pedido em aberto: não duplica
  const { data: aberto } = await db.from('vendas').select('id').eq('status', 'pendente').eq('email', email).maybeSingle()
  if (aberto) return { ok: true }
  if (!(await podeCadastrar())) return { ok: false, erro: 'Muitos pedidos seguidos daqui. Tente de novo mais tarde.' }

  const { error } = await db.from('vendas').insert({ nome, email, whatsapp, empresa, payer_name: payer || null, status: 'pendente' })
  if (error) return { ok: false, erro: 'Não consegui registrar o pedido. Tente de novo.' }
  await avisarAdminTarefix(`Venda do Tarefix: ${empresa} (${nome}) avisou o Pix de R$ 47`)
  return { ok: true }
}

export async function listarVendas(): Promise<Venda[]> {
  const { data } = await createTarefixAdmin().from('vendas').select('*').order('criado_em', { ascending: false }).limit(200)
  return (data ?? []) as Venda[]
}

export type ResultadoLiberacao =
  | { ok: true; email: string; senha: string | null; jaTinhaConta: boolean; nome: string; whatsapp: string }
  | { ok: false; erro: string }

/** Pix conferido: cria a conta + o Tarefix e marca a venda como liberada. */
export async function liberarVenda(adminId: string, id: string): Promise<ResultadoLiberacao> {
  const db = createTarefixAdmin()
  const { data: v } = await db.from('vendas').select('*').eq('id', id).maybeSingle()
  if (!v) return { ok: false, erro: 'Pedido não encontrado.' }
  if (v.status !== 'pendente') return { ok: false, erro: 'Este pedido já foi decidido.' }
  const r = await concederAcesso(adminId, { nome: v.nome, email: v.email, empresa: v.empresa })
  if (!r.ok) return r
  const { data: dono } = await db.from('donos').select('id').eq('email', String(v.email).toLowerCase()).maybeSingle()
  await db.from('vendas').update({ status: 'liberada', revisado_em: new Date().toISOString(), user_id: dono?.id ?? null }).eq('id', id)
  return { ok: true, email: r.email, senha: r.senha, jaTinhaConta: r.jaTinhaConta, nome: v.nome, whatsapp: v.whatsapp }
}

export async function recusarVenda(id: string, motivo: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const m = motivo.trim().slice(0, 240)
  if (m.length < 3) return { ok: false, erro: 'Informe o motivo.' }
  const { error } = await createTarefixAdmin().from('vendas').update({ status: 'recusada', motivo: m, revisado_em: new Date().toISOString() }).eq('id', id).eq('status', 'pendente')
  return error ? { ok: false, erro: 'Não consegui recusar.' } : { ok: true }
}

/** Texto pronto para mandar o acesso no WhatsApp. */
export function mensagemAcesso(d: { nome: string; email: string; senha: string | null; site: string }): string {
  const primeiro = d.nome.split(' ')[0]
  return [
    `Olá, ${primeiro}! Seu Tarefix foi liberado ✅`,
    '',
    `Entre em: ${d.site}/tarefix/entrar`,
    `E-mail: ${d.email}`,
    d.senha ? `Senha provisória: ${d.senha}` : 'Senha: a mesma que você já usa (esse e-mail já tinha conta).',
    '',
    d.senha ? 'Depois de entrar, troque a senha em Ajustes → Conta.' : '',
    'No celular, use "Adicionar à tela de início" para ter o ícone do Tarefix. Qualquer dúvida, é só chamar aqui!',
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n')
}
