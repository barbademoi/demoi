'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'

export async function salvarEmpresa(d: {
  nome: string
  logo_url: string | null
  horario_fechamento: string
  tom_mensagens: 'zoeira' | 'neutro'
  liberar_continuas_min: number
}): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const nome = d.nome.trim()
  if (!nome) return { ok: false, erro: 'Informe o nome da empresa.' }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.horario_fechamento.slice(0, 5))) return { ok: false, erro: 'Horário inválido.' }
  if (d.tom_mensagens !== 'zoeira' && d.tom_mensagens !== 'neutro') return { ok: false, erro: 'Tom inválido.' }
  const liberar = Math.round(Number(d.liberar_continuas_min))
  if (!Number.isFinite(liberar) || liberar < 0 || liberar > 720) return { ok: false, erro: 'Liberação das tarefas do dia todo: de 0 a 720 minutos.' }
  const { error } = await s.db
    .from('empresas')
    .update({ nome, logo_url: d.logo_url, horario_fechamento: d.horario_fechamento.slice(0, 5), tom_mensagens: d.tom_mensagens, liberar_continuas_min: liberar })
    .eq('id', s.empresa.id)
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}

export async function salvarBonus(d: {
  ativo: boolean
  mostrar_para_colaborador: boolean
  niveis: { percentual: number; premio: string }[]
}): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  const niveis = (Array.isArray(d.niveis) ? d.niveis : [])
    .map((n) => ({ percentual: Math.round(Number(n.percentual)), premio: String(n.premio ?? '').trim().slice(0, 40) }))
    .filter((n) => n.premio || n.percentual)
  if (d.ativo) {
    if (niveis.length === 0) return { ok: false, erro: 'Cadastre pelo menos um nível.' }
    if (niveis.some((n) => !Number.isFinite(n.percentual) || n.percentual < 1 || n.percentual > 100)) return { ok: false, erro: 'Cada nível precisa de um percentual entre 1 e 100.' }
    if (niveis.some((n) => !n.premio)) return { ok: false, erro: 'Cada nível precisa de um prêmio.' }
    if (new Set(niveis.map((n) => n.percentual)).size !== niveis.length) return { ok: false, erro: 'Dois níveis com o mesmo percentual.' }
  }
  niveis.sort((a, b) => a.percentual - b.percentual)
  const { error } = await s.db
    .from('bonus_config')
    .upsert(
      { empresa_id: s.empresa.id, ativo: d.ativo, mostrar_para_colaborador: d.mostrar_para_colaborador, niveis },
      { onConflict: 'empresa_id' }
    )
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}
