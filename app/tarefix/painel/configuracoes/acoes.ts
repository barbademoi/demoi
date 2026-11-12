'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'

export async function salvarEmpresa(d: {
  nome: string
  logo_url: string | null
  horario_fechamento: string
  tom_mensagens: 'zoeira' | 'neutro'
}): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const nome = d.nome.trim()
  if (!nome) return { ok: false, erro: 'Informe o nome da empresa.' }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.horario_fechamento.slice(0, 5))) return { ok: false, erro: 'Horário inválido.' }
  if (d.tom_mensagens !== 'zoeira' && d.tom_mensagens !== 'neutro') return { ok: false, erro: 'Tom inválido.' }
  const { error } = await s.db
    .from('empresas')
    .update({ nome, logo_url: d.logo_url, horario_fechamento: d.horario_fechamento.slice(0, 5), tom_mensagens: d.tom_mensagens })
    .eq('id', s.empresa.id)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}
