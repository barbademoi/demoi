import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { agoraSP, dataCurta, diaFechado, minutosDeHorario, minutosParaFechamento, somarDias } from '@/lib/tarefix/datas'
import { gerarTarefasDoDia, lerDia } from '@/lib/tarefix/tarefasDia'
import { garantirResumoDiario } from '@/lib/tarefix/painelHoje'
import { duracao, janela } from '@/lib/tarefix/prazo'
import { enviar, marcarEnviado, tiposLigados } from '@/lib/tarefix/push'
import type { Empresa } from '@/lib/tarefix/tipos'

/**
 * Rodado a cada ~5 min pelo agendador do Supabase (pg_cron → /tarefix/api/push/tick).
 * Cada aviso tem uma chave única em push_enviados: nunca sai duas vezes.
 *
 *  - inicio:     na hora de começar cada tarefa pendente (tolerância de 10 min)
 *  - fechamento: 30 min antes do fechamento, se houver pendentes (1x por dia)
 *  - resumo:     para o dono, até 1h depois do fechamento (1x por dia)
 */

const TOLERANCIA_INICIO_MIN = 10
const JANELA_FECHAMENTO_MIN = 30
const JANELA_RESUMO_MIN = 60

type Db = ReturnType<typeof createTarefixAdmin>
type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string; colaborador_id: string | null; dono_id: string | null }

export type ResultadoTick = { empresas: number; enviados: number; detalhes: string[] }

export async function rodarTick(ref: Date = new Date(), db: Db = createTarefixAdmin()): Promise<ResultadoTick> {
  const agora = agoraSP(ref)
  const hoje = agora.data
  const res: ResultadoTick = { empresas: 0, enviados: 0, detalhes: [] }

  const { data: empresas } = await db.from('empresas').select('*')
  for (const empresa of (empresas ?? []) as Empresa[]) {
    if (empresa.ativo === false) continue // suspensa
    res.empresas++
    const tipos = tiposLigados(empresa.push_tipos)
    const { data: insc } = await db.from('push_inscricoes').select('id, endpoint, p256dh, auth, colaborador_id, dono_id').eq('empresa_id', empresa.id)
    const inscricoes = (insc ?? []) as Inscricao[]
    if (inscricoes.length === 0) continue

    /* ----------------------------- colaboradores ----------------------------- */
    const porColab: Record<string, Inscricao[]> = {}
    for (const i of inscricoes) if (i.colaborador_id) (porColab[i.colaborador_id] ??= []).push(i)
    const idsColab = Object.keys(porColab)

    if (idsColab.length && (tipos.inicio || tipos.fechamento)) {
      const [{ data: colabs }, { data: folgas }] = await Promise.all([
        db.from('colaboradores').select('id, empresa_id, nome, token_acesso, ativo, criado_em').in('id', idsColab).eq('ativo', true),
        db.from('folgas').select('colaborador_id').eq('empresa_id', empresa.id).eq('data', hoje),
      ])
      const emFolga = new Set((folgas ?? []).map((f) => f.colaborador_id))

      for (const c of colabs ?? []) {
        if (emFolga.has(c.id)) continue
        await gerarTarefasDoDia(c, empresa, hoje, db)
        const tarefas = await lerDia(c.id, hoje, db)
        const url = `/tarefix/c/${c.token_acesso}`

        if (tipos.inicio && !diaFechado(hoje, empresa.horario_fechamento, ref)) {
          for (const t of tarefas) {
            if (t.status === 'feita' || t.continua || !t.horario_inicio) continue
            const ini = minutosDeHorario(t.horario_inicio)
            if (agora.minutosDoDia < ini || agora.minutosDoDia > ini + TOLERANCIA_INICIO_MIN) continue
            if (!(await marcarEnviado(`inicio:${t.id}`, empresa.id, db))) continue
            const n = await enviar(porColab[c.id], {
              titulo: `Agora: ${t.titulo}`,
              corpo: [janela(t), duracao(t.tempo_estimado_min)].filter(Boolean).join(' · ') || 'Hora de começar.',
              url,
              tag: `inicio-${t.id}`,
            }, db)
            res.enviados += n
            res.detalhes.push(`inicio ${c.nome}: ${t.titulo} (${n})`)
          }
        }

        if (tipos.fechamento) {
          const falta = minutosParaFechamento(empresa.horario_fechamento, ref)
          const pendentes = tarefas.filter((t) => t.status !== 'feita').length
          if (falta > 0 && falta <= JANELA_FECHAMENTO_MIN && pendentes > 0 && (await marcarEnviado(`fechamento:${c.id}:${hoje}`, empresa.id, db))) {
            const n = await enviar(porColab[c.id], {
              titulo: `Faltam ${falta} min para fechar`,
              corpo: `Você tem ${pendentes} tarefa${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''}. Bora fechar o dia!`,
              url,
              tag: `fechamento-${hoje}`,
            }, db)
            res.enviados += n
            res.detalhes.push(`fechamento ${c.nome} (${n})`)
          }
        }
      }
    }

    /* --------------------------------- dono --------------------------------- */
    const donos = inscricoes.filter((i) => i.dono_id)
    if (donos.length && tipos.resumo && diaFechado(hoje, empresa.horario_fechamento, ref)) {
      const passou = -minutosParaFechamento(empresa.horario_fechamento, ref)
      if (passou >= 0 && passou <= JANELA_RESUMO_MIN) {
        await garantirResumoDiario(empresa)
        const { data: aviso } = await db.from('avisos').select('texto').eq('empresa_id', empresa.id).eq('chave', `fechamento:${hoje}`).maybeSingle()
        if (aviso && (await marcarEnviado(`resumo:${empresa.id}:${hoje}`, empresa.id, db))) {
          const n = await enviar(donos, { titulo: `Fechamento ${dataCurta(hoje)}`, corpo: aviso.texto.replace(/^Fechamento \d\d\/\d\d: /, ''), url: '/tarefix/painel', tag: `resumo-${hoje}` }, db)
          res.enviados += n
          res.detalhes.push(`resumo ${empresa.nome} (${n})`)
        }
      }
    }
  }

  // faxina: o registro de enviados só precisa dos últimos dias
  await db.from('push_enviados').delete().lt('enviado_em', `${somarDias(hoje, -3)}T00:00:00Z`)
  return res
}
