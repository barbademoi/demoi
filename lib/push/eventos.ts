/**
 * AVISOS DE EVENTO — os que não esperam a hora do cron.
 *
 * Dois casos, e os dois são "aconteceu agora, e a outra ponta quer saber":
 * o barbeiro lançou a pontuação dele (o dono quer ver) e o dono lançou o dia
 * (o barbeiro quer ver a comissão atualizada).
 *
 * ── NUNCA DERRUBAM A AÇÃO QUE OS DISPAROU ───────────────────────────────────
 * Tudo aqui é embrulhado em try/catch e nada é aguardado pelo caminho crítico.
 * Se o push falhar, o lançamento já está salvo — e perder o lançamento porque
 * a notificação falhou seria trocar o essencial pelo acessório.
 *
 * ── UMA VEZ POR DIA, POR PESSOA ─────────────────────────────────────────────
 * O barbeiro lança seis serviços e salva seis vezes; o dono abre e salva o dia
 * três vezes. Sem trava, isso vira seis notificações. O `marco` inclui o dia e
 * o `unique` de `push_enviadas` resolve: o primeiro salvamento avisa, os
 * outros passam em silêncio.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import * as msg from './mensagens'
import { enviarPara, inscricoesPorDestino, reservarEnvio, pushConfigurado } from './enviar'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

/** Dia de hoje em São Paulo, 'AAAA-MM-DD'. */
function hojeSP(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/**
 * O barbeiro lançou pontos — avisa o DONO.
 *
 * `pontosHoje` e `pontosMes` entram se quem chamou já os tiver em mãos; não
 * vale fazer a apuração inteira só pra enfeitar a frase.
 */
export async function avisarDonoQuePontuou(opts: {
  barbeariaId: string
  barbeiroId: string
  nomeBarbeiro: string
  pontosHoje: number
  pontosMes?: number | null
}): Promise<void> {
  try {
    if (!pushConfigurado()) return
    if (!opts.pontosHoje || opts.pontosHoje <= 0) return

    const admin: Admin = createAdminClient()

    const { data: donosRaw } = await admin
      .from('usuarios').select('id').eq('barbearia_id', opts.barbeariaId)
    const donos = ((donosRaw ?? []) as { id: string }[]).map((u) => `dono:${u.id}`)
    if (donos.length === 0) return

    const porDestino = await inscricoesPorDestino(admin, [opts.barbeariaId])
    const mensagem = msg.donoBarbeiroPontuou(
      opts.nomeBarbeiro, opts.pontosHoje, opts.pontosMes ?? null)
    const marco = `pontos-barbeiro:${opts.barbeiroId}:${hojeSP()}`

    for (const destino of donos) {
      const aparelhos = porDestino.get(destino) ?? []
      if (aparelhos.length === 0) continue
      if (!(await reservarEnvio(admin, opts.barbeariaId, destino, 'barbeiro-pontuou', marco))) continue
      await enviarPara(admin, aparelhos, mensagem)
    }
  } catch (e) {
    console.error('[push] aviso de pontuação falhou:', e)
  }
}

/**
 * O dono lançou o dia — avisa os BARBEIROS.
 *
 * `comissaoPorBarbeiro` deixa cada um ver o próprio número; sem ele, o texto
 * cai na versão genérica, que também serve.
 */
export async function avisarBarbeirosQueDonoLancou(opts: {
  barbeariaId: string
  comissaoPorBarbeiro?: Record<string, number>
}): Promise<void> {
  try {
    if (!pushConfigurado()) return
    const admin: Admin = createAdminClient()

    const { data: barbeirosRaw } = await admin
      .from('barbeiros').select('id, link_codigo, ativo')
      .eq('barbearia_id', opts.barbeariaId).eq('ativo', true)
    const barbeiros = ((barbeirosRaw ?? []) as
      { id: string; link_codigo: string; ativo: boolean }[])
    if (barbeiros.length === 0) return

    const porDestino = await inscricoesPorDestino(admin, [opts.barbeariaId])
    const dia = hojeSP()

    for (const b of barbeiros) {
      const destino = `barbeiro:${b.id}`
      const aparelhos = porDestino.get(destino) ?? []
      if (aparelhos.length === 0) continue

      const marco = `dono-lancou:${dia}`
      if (!(await reservarEnvio(admin, opts.barbeariaId, destino, 'dono-lancou', marco))) continue

      const valor = opts.comissaoPorBarbeiro?.[b.id]
      await enviarPara(admin, aparelhos, msg.barbeiroDonoLancou(
        b.link_codigo, typeof valor === 'number' ? valor : null))
    }
  } catch (e) {
    console.error('[push] aviso de lançamento do dono falhou:', e)
  }
}
