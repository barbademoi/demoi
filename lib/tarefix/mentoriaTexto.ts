import { diaDaSemana, hojeSP } from '@/lib/tarefix/datas'

/* Textos da mentoria que rodam também no navegador (sem banco). */

type ComPrazo = { prazo: string; hora: string | null; situacao: 'atrasada' | 'hoje' | 'proxima' | 'aguardando' | 'devolvida' | 'concluida' }

/** Texto curto do prazo: "hoje às 18:00", "amanhã", "sex, 20/11", "atrasada há 2 dias". */
export function textoPrazo(e: ComPrazo, hoje = hojeSP()): string {
  const dias = Math.round((Date.parse(`${e.prazo}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000)
  const hora = e.hora ? ` às ${e.hora}` : ''
  if (e.situacao === 'atrasada') return dias < 0 ? `atrasada há ${-dias} dia${dias < -1 ? 's' : ''}` : `atrasada (era até${hora})`
  if (dias === 0) return `até hoje${hora}`
  if (dias === 1) return `até amanhã${hora}`
  const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const [, mm, dd] = e.prazo.split('-')
  return `até ${nomes[diaDaSemana(e.prazo)]}, ${dd}/${mm}${hora}${dias > 1 && dias <= 6 ? ` · faltam ${dias} dias` : ''}`
}
