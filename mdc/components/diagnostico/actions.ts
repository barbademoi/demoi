'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { buscarMembro, semanaDoMembro, statusExibido } from '@/lib/membro'
import { digitos } from '@/lib/format'
import { ETAPAS_90DIAS, ETAPAS_ENTRADA, limparRespostas, validarEtapa, type Respostas } from '@/lib/diagnostico'

type Res = { ok: true } | { ok: false; erro?: string; etapa?: number; erros?: Record<string, string> }

export async function salvarDiagnostico(tipo: 'entrada' | '90dias', bruto: Respostas): Promise<Res> {
  const { user, membro } = await buscarMembro()
  if (!user || !membro) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  const st = statusExibido(membro)
  if (st !== 'ativo' && st !== 'vence_em_breve') return { ok: false, erro: 'Seu acesso não está ativo.' }
  if (tipo === '90dias' && semanaDoMembro(membro.data_inicio) < 13) return { ok: false, erro: 'A reavaliação abre na sua semana 13.' }

  const etapas = tipo === 'entrada' ? ETAPAS_ENTRADA : ETAPAS_90DIAS
  if (typeof bruto !== 'object' || bruto === null) return { ok: false, erro: 'Respostas inválidas.' }
  for (let i = 0; i < etapas.length; i++) {
    const erros = validarEtapa(etapas[i], bruto)
    if (Object.keys(erros).length) return { ok: false, erro: 'Confere os campos marcados.', etapa: i, erros }
  }
  const respostas = limparRespostas(etapas, bruto)
  if (respostas.whatsapp) respostas.whatsapp = digitos(String(respostas.whatsapp))

  const admin = createAdminClient()
  const { error } = await admin
    .from('diagnosticos')
    .upsert({ member_id: user.id, tipo, respostas }, { onConflict: 'member_id,tipo', ignoreDuplicates: tipo === 'entrada' })
  if (error) return { ok: false, erro: 'Não deu pra salvar. Tenta de novo.' }

  if (tipo === 'entrada') {
    // "Você trabalha" define o perfil; cidade vai pro ranking.
    const upd: Record<string, string> = { perfil: String(respostas.perfil) }
    if (respostas.nome) upd.nome = String(respostas.nome)
    if (respostas.whatsapp) upd.whatsapp = String(respostas.whatsapp)
    if (respostas.cidade) upd.cidade = String(respostas.cidade)
    if (respostas.uf) upd.uf = String(respostas.uf)
    await admin.from('members').update(upd).eq('id', user.id)
  }
  return { ok: true }
}
