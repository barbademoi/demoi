import { createHmac, timingSafeEqual } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { segredoSessao } from '@/lib/tarefix/segredo'
import { agoraSP, hojeSP, minutosDeHorario } from '@/lib/tarefix/datas'
import { avisarDonos } from '@/lib/tarefix/push'

/**
 * Botões dentro da notificação ("Feito" / "Adiar 15 min").
 * O service worker não tem a sessão de quem recebeu, então cada notificação
 * leva um passe assinado (HMAC) que vale só para AQUELA tarefa, por 24h.
 * Feito: só para tarefa sem foto e que não é do dia todo (essas abrem o app).
 * Adiar: só no Meu dia (o horário da equipe é o dono quem define).
 */

type Db = ReturnType<typeof createTarefixAdmin>
export type AcaoPush = 'feito' | 'adiar'

const assinar = (txt: string) => createHmac('sha256', segredoSessao()).update(`acao-push:${txt}`).digest('base64url').slice(0, 32)

export function passeDaTarefa(tarefaId: string, validadeH = 24): string {
  const exp = Math.floor(Date.now() / 1000) + validadeH * 3600
  const corpo = `${tarefaId}.${exp}`
  return `${corpo}.${assinar(corpo)}`
}

export function lerPasse(passe: string): string | null {
  const [id, exp, ass] = String(passe ?? '').split('.')
  if (!id || !exp || !ass) return null
  const esperado = Buffer.from(assinar(`${id}.${exp}`))
  const recebido = Buffer.from(ass)
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null
  if (Number(exp) < Date.now() / 1000) return null
  return id
}

/** Que botões uma tarefa pode ter na notificação. */
export function botoesPara(t: { exige_foto: boolean; continua: boolean }, pessoal: boolean): AcaoPush[] {
  const b: AcaoPush[] = []
  if (!t.exige_foto && !t.continua) b.push('feito')
  if (pessoal && !t.continua) b.push('adiar')
  return b
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export type ResultadoAcao = { ok: true; mensagem: string } | { ok: false; erro: string }

export async function executarAcao(passe: string, acao: AcaoPush, db: Db = createTarefixAdmin()): Promise<ResultadoAcao> {
  const id = lerPasse(passe)
  if (!id) return { ok: false, erro: 'Este aviso expirou. Abra o Tarefix.' }
  const { data: t } = await db.from('tarefas_dia').select('*').eq('id', id).maybeSingle()
  if (!t) return { ok: false, erro: 'Tarefa não encontrada.' }
  if (t.data !== hojeSP()) return { ok: false, erro: 'Essa tarefa não é de hoje.' }
  const { data: c } = await db.from('colaboradores').select('id, nome, ativo, eh_dono, empresa_id').eq('id', t.colaborador_id).maybeSingle()
  const { data: empresa } = await db.from('empresas').select('*').eq('id', t.empresa_id).maybeSingle()
  if (!c || !c.ativo || !empresa || empresa.ativo === false) return { ok: false, erro: 'Acesso indisponível.' }
  if (!botoesPara(t, Boolean(c.eh_dono)).includes(acao)) return { ok: false, erro: 'Abra o Tarefix para concluir esta tarefa.' }

  if (acao === 'feito') {
    if (t.status === 'feita') return { ok: true, mensagem: `Já estava feita: ${t.titulo}` }
    const { data: atualizada } = await db
      .from('tarefas_dia')
      .update({ status: 'feita', feita_em: new Date().toISOString(), motivo_reprovacao: null })
      .eq('id', t.id)
      .in('status', ['pendente', 'reprovada'])
      .select('id')
      .maybeSingle()
    if (atualizada && !c.eh_dono) {
      await avisarDonos(empresa, 'concluida', {
        titulo: `${c.nome.split(' ')[0]} concluiu uma tarefa`,
        corpo: `${t.titulo} · pela notificação`,
        url: `/tarefix/painel?c=${c.id}`,
        tag: `concluida-${c.id}`,
      })
    }
    return { ok: true, mensagem: `Feito ✓ ${t.titulo}` }
  }

  // adiar 15 min (Meu dia)
  if (t.status !== 'pendente') return { ok: true, mensagem: `Nada a adiar: ${t.titulo}` }
  const agora = agoraSP().minutosDoDia
  const novo = Math.min(Math.ceil((agora + 15) / 5) * 5, 23 * 60 + 55)
  const delta = t.horario_inicio ? novo - minutosDeHorario(t.horario_inicio) : 0
  const limite = t.horario_limite ? hhmm(Math.min(minutosDeHorario(t.horario_limite) + Math.max(delta, 0), 23 * 60 + 55)) : null
  if (t.origem === 'avulsa') await db.from('tarefas_avulsas').update({ horario_inicio: hhmm(novo), horario_limite: limite }).eq('id', t.origem_id)
  await db.from('tarefas_dia').update({ horario_inicio: hhmm(novo), horario_limite: limite, ajustada: true }).eq('id', t.id)
  await db.from('push_enviados').delete().like('chave', `%:${t.id}`) // os lembretes valem de novo para o novo horário
  return { ok: true, mensagem: `Adiada para ${hhmm(novo)}: ${t.titulo}` }
}
