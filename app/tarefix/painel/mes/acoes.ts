'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, falha, type Resultado } from '@/lib/tarefix/dono'
import { anoMesDe, hojeSP } from '@/lib/tarefix/datas'
import { carregarMesDono } from '@/lib/tarefix/mesDono'

/**
 * Fecha o mês: grava em meses_fechados o % final, as extras aprovadas e o
 * nível de bônus de cada colaborador. Depois disso o banco trava qualquer
 * alteração daquele mês (gatilho trava_mes_fechado).
 * Só meses que já terminaram.
 */
export async function fecharMes(anoMes: string): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(anoMes)) return { ok: false, erro: 'Mês inválido.' }
  if (anoMes >= anoMesDe(hojeSP())) return { ok: false, erro: 'Só dá para fechar um mês depois que ele termina.' }

  const resumo = await carregarMesDono(s.empresa, anoMes)
  if (resumo.fechado) return { ok: false, erro: 'Este mês já foi fechado.' }
  const linhas = resumo.linhas.filter((l) => l.placar)
  if (linhas.length === 0) return { ok: false, erro: 'Ninguém teve tarefas neste mês. Não há o que fechar.' }

  const { error } = await s.db.from('meses_fechados').insert(
    linhas.map((l) => ({
      empresa_id: s.empresa.id,
      colaborador_id: l.colaborador_id,
      ano_mes: anoMes,
      percentual_final: l.placar!.percentual,
      extras_aprovadas: l.extrasAprovadas,
      bonus_atingido: resumo.bonusAtivo ? l.bonus?.atingido ?? null : null,
    }))
  )
  if (error) return falha(error)
  revalidatePath('/tarefix/painel', 'layout')
  return { ok: true }
}
