import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { criarEmpresaEDono } from '@/lib/tarefix/cadastro'
import { avisarDonos } from '@/lib/tarefix/push'

/**
 * Tarefix vendido dentro do BarberMeta. Só o servidor usa este módulo.
 *
 * Liberar = garantir que a conta do dono tenha um Tarefix (empresa + dono no
 * schema tarefix). Quem já tinha (ex.: criou grátis antes) só continua com o
 * dele: nada é duplicado nem apagado.
 */
export async function garantirTarefixDoDono(d: { userId: string; email: string; nomeBarbearia: string; nomeDono?: string | null }): Promise<{ ok: true; criado: boolean } | { ok: false; erro: string }> {
  const db = createTarefixAdmin()
  const { data: dono } = await db.from('donos').select('id, empresa_id').eq('id', d.userId).maybeSingle()
  if (dono) {
    // reativa se estava suspenso
    await db.from('empresas').update({ ativo: true }).eq('id', dono.empresa_id)
    return { ok: true, criado: false }
  }
  const nome = (d.nomeDono?.trim() || d.email.split('@')[0]).slice(0, 80) || 'Dono'
  const r = await criarEmpresaEDono(db, { userId: d.userId, nome, email: d.email.toLowerCase(), empresa: d.nomeBarbearia.slice(0, 80) || 'Minha barbearia' })
  if (!r.ok) return r
  return { ok: true, criado: true }
}

/** Suspender no BarberMeta suspende o Tarefix criado pela compra. */
export async function suspenderTarefixDoDono(userId: string): Promise<void> {
  const db = createTarefixAdmin()
  const { data: dono } = await db.from('donos').select('empresa_id').eq('id', userId).maybeSingle()
  if (dono) await db.from('empresas').update({ ativo: false }).eq('id', dono.empresa_id)
}

/**
 * Avisa o administrador do Tarefix (sininho + celular) que entrou um pedido.
 * Nunca lança erro: o pedido do cliente não pode falhar por causa do aviso.
 */
export async function avisarAdminTarefix(texto: string): Promise<void> {
  try {
    const db = createTarefixAdmin()
    const { data: admins } = await db.from('admins').select('user_id')
    const ids = (admins ?? []).map((a) => a.user_id)
    if (!ids.length) return
    const { data: donos } = await db.from('donos').select('empresa_id').in('id', ids)
    const empresas = Array.from(new Set((donos ?? []).map((x) => x.empresa_id as string)))
    for (const empresaId of empresas) {
      await db.from('avisos').insert({ empresa_id: empresaId, tipo: 'geral', texto, link: '/admin/tarefix', chave: `tarefix-pedido:${Date.now()}` })
      const { data: empresa } = await db.from('empresas').select('id, push_tipos').eq('id', empresaId).maybeSingle()
      if (empresa) await avisarDonos(empresa, 'extra', { titulo: 'Novo pedido do Tarefix', corpo: `${texto} · confira o Pix`, url: '/admin/tarefix', tag: 'tarefix-pedido' })
    }
  } catch (e) {
    console.error('[tarefix-modulo] aviso ao admin', e)
  }
}
