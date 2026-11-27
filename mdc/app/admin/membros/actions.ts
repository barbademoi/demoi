'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { calcularPeriodo } from '@/lib/pagamentos'
import { plano as acharPlano, planoValido } from '@/lib/planos'

type Res = { ok: boolean; erro?: string; msg?: string }
const DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Confirma um pagamento (com comprovante: paymentId; sem: paymentId vazio,
 * ex.: pago em dinheiro). Ativa o membro, define o início na primeira vez e
 * calcula/estende o vencimento.
 */
export async function confirmarPagamento(fd: FormData): Promise<Res> {
  try {
    const { supabase, user } = await assertAdmin()
    const memberId = String(fd.get('member_id') ?? '')
    const paymentId = String(fd.get('payment_id') ?? '')
    const planoId = String(fd.get('plano') ?? '')
    const valor = Number(String(fd.get('valor') ?? '').replace(/\./g, '').replace(',', '.'))
    const forma = String(fd.get('forma') ?? '')
    const pagoEm = String(fd.get('pago_em') ?? '')
    const inicio = String(fd.get('data_inicio') ?? '') || null

    if (!planoValido(planoId)) return { ok: false, erro: 'Plano inválido.' }
    if (!(valor >= 0) || valor > 100000) return { ok: false, erro: 'Valor inválido.' }
    if (!['pix', 'cartao', 'dinheiro', 'outro'].includes(forma)) return { ok: false, erro: 'Forma inválida.' }
    if (!DATA.test(pagoEm)) return { ok: false, erro: 'Data do pagamento inválida.' }
    if (inicio && !DATA.test(inicio)) return { ok: false, erro: 'Data de início inválida.' }

    const { data: m } = await supabase.from('members').select('id, data_inicio, vencimento, whatsapp').eq('id', memberId).single()
    if (!m) return { ok: false, erro: 'Membro não encontrado.' }

    if (paymentId) {
      const { data: p } = await supabase.from('payments').select('status, member_id').eq('id', paymentId).single()
      if (!p || p.member_id !== memberId) return { ok: false, erro: 'Pagamento não encontrado.' }
      if (p.status === 'confirmado') return { ok: false, erro: 'Esse pagamento já foi confirmado.' }
    }

    const per = calcularPeriodo({
      dataInicioAtual: m.data_inicio,
      vencimentoAtual: m.vencimento,
      pagoEm,
      inicioEscolhido: inicio,
      meses: acharPlano(planoId)!.meses,
    })

    const dadosPagamento = {
      plano: planoId,
      status: 'confirmado',
      valor,
      forma,
      pago_em: pagoEm,
      periodo_inicio: per.periodoInicio,
      periodo_fim: per.vencimento,
      confirmado_em: new Date().toISOString(),
      confirmado_por: user.id,
    }
    const { error: e1 } = paymentId
      ? await supabase.from('payments').update(dadosPagamento).eq('id', paymentId)
      : await supabase.from('payments').insert({ ...dadosPagamento, member_id: memberId })
    if (e1) return { ok: false, erro: e1.message }

    const { error: e2 } = await supabase
      .from('members')
      .update({ status: 'ativo', plano: planoId, data_inicio: per.dataInicio, vencimento: per.vencimento })
      .eq('id', memberId)
    if (e2) return { ok: false, erro: e2.message }

    // Se veio da lista de espera, marca o lead como "comprou".
    if (per.primeiraVez && m.whatsapp) {
      await supabase.from('leads').update({ status: 'comprou' }).in('whatsapp', [m.whatsapp, m.whatsapp.replace(/^55/, '')])
    }

    revalidatePath('/admin/membros')
    revalidatePath(`/admin/membros/${memberId}`)
    return { ok: true, msg: `Confirmado! Acesso até ${per.vencimento.split('-').reverse().join('/')}.` }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}

export async function recusarPagamento(paymentId: string, motivo: string): Promise<Res> {
  try {
    const { supabase } = await assertAdmin()
    const { data: p } = await supabase.from('payments').select('member_id, status').eq('id', paymentId).single()
    if (!p || p.status !== 'enviado') return { ok: false, erro: 'Pagamento não está aguardando.' }
    await supabase.from('payments').update({ status: 'recusado', observacao: motivo.slice(0, 500) || null }).eq('id', paymentId)
    // Sem outro comprovante na fila, volta pra "aguardando pagamento" (pode mandar de novo).
    const { count } = await supabase.from('payments').select('id', { count: 'exact', head: true }).eq('member_id', p.member_id).eq('status', 'enviado')
    if (!count) await supabase.from('members').update({ status: 'pendente' }).eq('id', p.member_id).eq('status', 'aguardando')
    revalidatePath(`/admin/membros/${p.member_id}`)
    return { ok: true, msg: 'Comprovante recusado.' }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}

export async function salvarMembro(fd: FormData): Promise<Res> {
  try {
    const { supabase } = await assertAdmin()
    const id = String(fd.get('id') ?? '')
    const data_inicio = String(fd.get('data_inicio') ?? '') || null
    const vencimento = String(fd.get('vencimento') ?? '') || null
    const planoId = String(fd.get('plano') ?? '')
    const perfil = String(fd.get('perfil') ?? '') || null
    const status = String(fd.get('status') ?? '')
    if ((data_inicio && !DATA.test(data_inicio)) || (vencimento && !DATA.test(vencimento))) return { ok: false, erro: 'Data inválida.' }
    if (!planoValido(planoId)) return { ok: false, erro: 'Plano inválido.' }
    if (perfil && !['sozinho', 'equipe'].includes(perfil)) return { ok: false, erro: 'Perfil inválido.' }
    if (!['pendente', 'aguardando', 'ativo', 'cancelado'].includes(status)) return { ok: false, erro: 'Status inválido.' }
    if (status === 'ativo' && (!data_inicio || !vencimento)) return { ok: false, erro: 'Membro ativo precisa de início e vencimento.' }

    const { error } = await supabase
      .from('members')
      .update({
        data_inicio,
        vencimento,
        plano: planoId,
        perfil,
        status,
        fundador: fd.get('fundador') === 'on',
        convidado: fd.get('convidado') === 'on',
        observacao: String(fd.get('observacao') ?? '').slice(0, 2000) || null,
      })
      .eq('id', id)
    if (error) return { ok: false, erro: error.message }
    revalidatePath(`/admin/membros/${id}`)
    revalidatePath('/admin/membros')
    return { ok: true, msg: 'Salvo!' }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
