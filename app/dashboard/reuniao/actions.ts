'use server'

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { emailTemReuniao } from '@/lib/reuniao/preview'
import { gerarRaioXReuniao, type RaioXReuniao } from '@/lib/reuniao/raioX'

// Resolve o dono autenticado E confere acesso ao módulo (allowlist preview).
// Retorna barbearia_id só se o e-mail estiver liberado. Trava REAL no servidor.
type Acesso =
  | { ok: false; error: string }
  | { ok: true; supabase: ReturnType<typeof createClient>; barbeariaId: string }

async function donoComAcesso(): Promise<Acesso> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }
  if (!emailTemReuniao(user.email ?? null)) return { ok: false, error: 'Sem acesso ao módulo de Reunião.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  const barbeariaId = (data as { barbearia_id: string } | null)?.barbearia_id
  if (!barbeariaId) return { ok: false, error: 'Barbearia não encontrada.' }
  return { ok: true, supabase, barbeariaId }
}

const fmtBRL = (n: number) =>
  `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function montarContexto(rx: RaioXReuniao): string {
  const b: string[] = []
  b.push(`PERÍODO: ${rx.cicloLabel} (dia ${rx.diasDecorridos} de ${rx.totalDiasCiclo})`)
  b.push(`BASE DA META: ${rx.baseLabel}`)
  const deltaTxt = rx.totalDeltaPct == null ? 'sem base anterior' : `${rx.totalDeltaPct >= 0 ? '+' : ''}${Math.round(rx.totalDeltaPct)}% vs. mesmo período do mês passado`
  b.push(`EQUIPE — ${rx.baseLabel} acumulado: ${fmtBRL(rx.totalAtual)} (${deltaTxt}); mesmo período do mês passado: ${fmtBRL(rx.totalMesmoPeriodoAnterior)}; projeção de fechamento: ${fmtBRL(rx.totalProjetado)}`)

  b.push('POR BARBEIRO (número já apurado pelo sistema):')
  for (const l of rx.barbeiros) {
    const d = l.deltaPct == null ? 's/ base anterior' : `${l.deltaPct >= 0 ? '+' : ''}${Math.round(l.deltaPct)}% vs. mesmo período`
    const meta = l.metaFoco > 0 ? `; meta foco ${fmtBRL(l.metaFoco)}; projeção ${fmtBRL(l.projetado)} (${l.ritmoOk ? 'no ritmo' : 'atrás do ritmo'})` : ''
    b.push(`- ${l.nome}: ${fmtBRL(l.valorAtual)} (${d}); ${l.pontos} pts${meta}`)
  }

  if (rx.precisamAtencao.length > 0) {
    b.push('PRECISAM DE ATENÇÃO (apurado pelo sistema):')
    for (const l of rx.precisamAtencao) b.push(`- ${l.nome}: ${l.motivoAtencao}`)
  } else {
    b.push('PRECISAM DE ATENÇÃO: ninguém em alerta neste período.')
  }

  const d = rx.destaques
  const dst: string[] = []
  if (d.pontuacao) dst.push(`Mais pontos: ${d.pontuacao.nome} (${d.pontuacao.valorFmt})`)
  if (d.faturamento) dst.push(`${d.faturamentoLabel}: ${d.faturamento.nome} (${d.faturamento.valorFmt})`)
  if (d.evolucao) dst.push(`Maior evolução: ${d.evolucao.nome} (${d.evolucao.valorFmt} vs. mesmo período)`)
  if (dst.length > 0) b.push(`DESTAQUES:\n${dst.map(x => `- ${x}`).join('\n')}`)

  return b.join('\n')
}

/**
 * PAUTA POR IA. A IA recebe os NÚMEROS JÁ APURADOS pelo raio-x (não recalcula
 * nada) e redige resumo + pontos de atenção + sugestões de pauta. Se faltar a
 * chave, avisa. Só leitura.
 */
export async function gerarPautaReuniao(): Promise<{ texto: string } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'IA indisponível: falta a chave ANTHROPIC_API_KEY no ambiente. Configure pra gerar a pauta.' }
  }

  const rx = await gerarRaioXReuniao(acesso.supabase, acesso.barbeariaId)
  if (rx.barbeiros.length === 0) {
    return { error: 'Sem dados da equipe neste período pra montar a pauta.' }
  }

  const contexto = montarContexto(rx)
  const prompt = `Você é um assistente de gestão de barbearias. Com base APENAS nos números já apurados abaixo (não invente, não recalcule, não crie valores que não estão aqui), escreva uma pauta prática pro dono conduzir a reunião com a equipe.

Estrutura:
1. RESUMO DO MÊS (2-4 linhas): como a equipe está vs. o mesmo período do mês passado e a projeção de fechamento.
2. PONTOS DE ATENÇÃO POR BARBEIRO: cite nominalmente quem precisa de atenção e por quê (ex.: "Fulano caiu X% vs. mesmo período").
3. QUEM PUXA O TIME: destaque quem está indo bem.
4. SUGESTÕES DE PAUTA: 3 a 5 tópicos objetivos pra reunião.

Tom: prático, direto, humano, em português do Brasil — como um dono falando. Sem coach, sem enrolação. Use os valores exatamente como estão nos dados.

DADOS APURADOS:
${contexto}

Retorne só o texto da pauta, pronto pra ler na reunião.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1600,
      messages: [{ role: 'user', content: prompt }],
    })
    const texto = msg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()
    if (!texto) return { error: 'Não consegui gerar a pauta agora.' }
    return { texto }
  } catch (err) {
    console.error('[gerarPautaReuniao] erro:', err)
    return { error: 'Erro ao gerar a pauta. Tente de novo em alguns segundos.' }
  }
}

// ── Anotações / checklist ────────────────────────────────────────────────
export interface NotaReuniao {
  id: string
  texto: string
  feito: boolean
  ordem: number
}

// Erro amigável quando a tabela ainda não foi criada (migration 037 pendente).
function semTabela(err: unknown): boolean {
  const msg = (err as { message?: string } | null)?.message ?? String(err ?? '')
  return /reuniao_notas|does not exist|relation .* does not exist|schema cache/i.test(msg)
}

export async function criarNota(texto: string): Promise<{ nota: NotaReuniao } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  const limpo = texto.trim().slice(0, 500)
  if (!limpo) return { error: 'Escreva algo na anotação.' }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (acesso.supabase as any)
      .from('reuniao_notas')
      .insert({ barbearia_id: acesso.barbeariaId, texto: limpo, feito: false, ordem: Date.now() % 2_000_000_000 })
      .select('id, texto, feito, ordem')
      .single()
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { nota: data as NotaReuniao }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[criarNota] erro:', err)
    return { error: 'Erro ao salvar a anotação.' }
  }
}

export async function atualizarNota(
  id: string,
  patch: { texto?: string; feito?: boolean },
): Promise<{ ok: true } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof patch.texto === 'string') {
    const limpo = patch.texto.trim().slice(0, 500)
    if (!limpo) return { error: 'A anotação não pode ficar vazia.' }
    updates.texto = limpo
  }
  if (typeof patch.feito === 'boolean') updates.feito = patch.feito
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (acesso.supabase as any)
      .from('reuniao_notas').update(updates)
      .eq('id', id).eq('barbearia_id', acesso.barbeariaId)
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { ok: true }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[atualizarNota] erro:', err)
    return { error: 'Erro ao salvar.' }
  }
}

export async function removerNota(id: string): Promise<{ ok: true } | { error: string }> {
  const acesso = await donoComAcesso()
  if (!acesso.ok) return { error: acesso.error }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (acesso.supabase as any)
      .from('reuniao_notas').delete()
      .eq('id', id).eq('barbearia_id', acesso.barbeariaId)
    if (error) throw error
    revalidatePath('/dashboard/reuniao')
    return { ok: true }
  } catch (err) {
    if (semTabela(err)) return { error: 'Anotações indisponíveis: rode a migration 037_reuniao_notas.sql no Supabase.' }
    console.error('[removerNota] erro:', err)
    return { error: 'Erro ao remover.' }
  }
}
