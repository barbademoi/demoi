import { createHmac, timingSafeEqual } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { segredoSessao } from '@/lib/tarefix/segredo'
import { agoraSP, diaDaSemana, hojeSP, somarDias } from '@/lib/tarefix/datas'
import { lerDia } from '@/lib/tarefix/tarefasDia'

/**
 * Agenda do celular: um link .ics que a pessoa assina uma vez (Google Agenda /
 * Calendário do iPhone). As tarefas com horário dos próximos 14 dias viram
 * eventos com alerta 15 min antes — o alerta é do próprio celular (toca mesmo
 * sem internet e com o Tarefix fechado). O app de agenda busca de novo sozinho.
 *
 * O link leva uma chave derivada do token do colaborador: gerar link novo no
 * Tarefix invalida também a agenda antiga.
 */

type Db = ReturnType<typeof createTarefixAdmin>
type ColabAgenda = { id: string; nome: string; token_acesso: string; ativo: boolean; criado_em: string; eh_dono?: boolean; empresa_id: string }

export const ALERTA_MIN = 15
const DIAS_A_FRENTE = 14

export function chaveAgenda(c: Pick<ColabAgenda, 'id' | 'token_acesso'>): string {
  return createHmac('sha256', segredoSessao()).update(`agenda:${c.id}:${c.token_acesso}`).digest('base64url').slice(0, 32)
}

export function caminhoAgenda(c: Pick<ColabAgenda, 'id' | 'token_acesso'>): string {
  return `/tarefix/agenda/${c.id}/${chaveAgenda(c)}/tarefix.ics`
}

export function chaveConfere(c: Pick<ColabAgenda, 'id' | 'token_acesso'>, chave: string): boolean {
  const a = Buffer.from(chaveAgenda(c))
  const b = Buffer.from(String(chave ?? ''))
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Texto seguro para .ics (vírgula, ponto e vírgula, barra e quebra de linha). */
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Quebra linhas longas (máx. 75 octetos) como pede o padrão. */
function dobrar(linha: string): string {
  const partes: string[] = []
  let atual = ''
  for (const ch of linha) {
    if (Buffer.byteLength(atual + ch) > 73) {
      partes.push(atual)
      atual = ch
    } else atual += ch
  }
  partes.push(atual)
  return partes.join('\r\n ')
}

/** 'AAAA-MM-DD' + 'HH:MM' de Brasília (UTC−3, sem horário de verão desde 2019) → '…Z'. */
function utc(data: string, hora: string, somaMin = 0): string {
  const [a, m, d] = data.split('-').map(Number)
  const [h, mi] = hora.split(':').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d, h + 3, mi + somaMin))
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

type Evento = { uid: string; data: string; hora: string; min: number; titulo: string; descricao: string | null }

export async function gerarIcs(c: ColabAgenda, base: string, db: Db = createTarefixAdmin()): Promise<string> {
  const hoje = hojeSP()
  const ate = somarDias(hoje, DIAS_A_FRENTE)
  const inicio = agoraSP(new Date(c.criado_em)).data
  const [doDia, { data: modelos }, { data: avulsas }, { data: folgas }] = await Promise.all([
    lerDia(c.id, hoje, db),
    db.from('tarefas_modelo').select('id, titulo, descricao, dias_semana, horario_inicio, tempo_estimado_min, continua').eq('colaborador_id', c.id).eq('ativo', true),
    db.from('tarefas_avulsas').select('id, titulo, descricao, data, horario_inicio, tempo_estimado_min, continua').eq('colaborador_id', c.id).gt('data', hoje).lte('data', ate),
    db.from('folgas').select('data').eq('colaborador_id', c.id).gte('data', hoje).lte('data', ate),
  ])
  const folga = new Set((folgas ?? []).map((f) => f.data))
  const eventos: Evento[] = []

  // hoje: o que está de fato no dia (com +1h/adiamentos), só o que falta fazer
  if (!folga.has(hoje)) {
    for (const t of doDia) {
      if (t.continua || !t.horario_inicio || t.status === 'feita' || t.status === 'adiada') continue
      eventos.push({ uid: `d-${t.id}`, data: hoje, hora: t.horario_inicio.slice(0, 5), min: t.tempo_estimado_min ?? 15, titulo: t.titulo, descricao: t.descricao })
    }
  }
  // próximos dias: o previsto pelas recorrentes e avulsas
  for (let i = 1; i <= DIAS_A_FRENTE; i++) {
    const d = somarDias(hoje, i)
    if (d < inicio || folga.has(d)) continue
    const dow = diaDaSemana(d)
    for (const m of modelos ?? []) {
      if (m.continua || !m.horario_inicio || !m.dias_semana.includes(dow)) continue
      eventos.push({ uid: `m-${m.id}-${d}`, data: d, hora: m.horario_inicio.slice(0, 5), min: m.tempo_estimado_min ?? 15, titulo: m.titulo, descricao: m.descricao })
    }
    for (const a of avulsas ?? []) {
      if (a.data !== d || a.continua || !a.horario_inicio) continue
      eventos.push({ uid: `a-${a.id}`, data: d, hora: a.horario_inicio.slice(0, 5), min: a.tempo_estimado_min ?? 15, titulo: a.titulo, descricao: a.descricao })
    }
  }

  const link = c.eh_dono ? `${base}/tarefix/painel/meu-dia` : `${base}/tarefix/c/${c.token_acesso}`
  const carimbo = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tarefix//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(c.eh_dono ? 'Tarefix · Meu dia' : `Tarefix · ${c.nome.split(' ')[0]}`)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]
  for (const e of eventos) {
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@tarefix`,
      `DTSTAMP:${carimbo}`,
      `DTSTART:${utc(e.data, e.hora)}`,
      `DTEND:${utc(e.data, e.hora, Math.max(5, Math.min(e.min, 600)))}`,
      `SUMMARY:${esc(e.titulo)}`,
      `DESCRIPTION:${esc([e.descricao, `Marcar no Tarefix: ${link}`].filter(Boolean).join('\n\n'))}`,
      `URL:${link}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.titulo)}`,
      `TRIGGER:-PT${ALERTA_MIN}M`,
      'END:VALARM',
      'END:VEVENT'
    )
  }
  linhas.push('END:VCALENDAR')
  return linhas.map(dobrar).join('\r\n') + '\r\n'
}
