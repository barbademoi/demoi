'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizarNome } from '@/lib/importAgenda/conciliacao'

async function getBarbeariaId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, barbeariaId: null, userId: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  return {
    supabase,
    barbeariaId: (data as { barbearia_id: string } | null)?.barbearia_id ?? null,
    userId: user.id,
  }
}

/**
 * Confirma que um nome do Agenda Serviço é um barbeiro do BarberMeta.
 *
 * A partir daqui, toda importação usa este vínculo — o dono não precisa
 * renomear ninguém. Renomear o barbeiro pra ficar igual ao relatório mudaria o
 * nome que aparece no ranking, no card de pagamento e na tela dele, só pra
 * agradar um sistema de fora.
 */
export async function confirmarDePara(nomeOrigem: string, barbeiroId: string) {
  const { supabase, barbeariaId, userId } = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // O barbeiro tem que ser desta barbearia. A RLS já barraria a escrita, mas
  // sem isto um id de fora viraria um vínculo que nunca importa nada e que
  // ninguém entenderia depois.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros').select('id, ativo')
    .eq('id', barbeiroId).eq('barbearia_id', barbeariaId).maybeSingle() as
    { data: { id: string; ativo: boolean } | null }
  if (!barbeiro) return { error: 'Profissional não encontrado nesta barbearia.' }
  if (!barbeiro.ativo) return { error: 'Esse profissional está desativado. Reative antes de vincular.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('import_agenda_depara')
    .update({
      barbeiro_id: barbeiroId,
      ignorar: false,
      confirmado_por: userId,
      confirmado_em: new Date().toISOString(),
    })
    .eq('barbearia_id', barbeariaId)
    .eq('nome_origem', nomeOrigem)

  if (error) return { error: 'Não foi possível salvar o vínculo.' }

  revalidatePath('/dashboard/importar-relatorio')
  return { ok: true }
}

/** "Esse nome não é ninguém" — para de aparecer, sem virar vínculo falso. */
export async function ignorarNome(nomeOrigem: string) {
  const { supabase, barbeariaId, userId } = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('import_agenda_depara')
    .update({
      ignorar: true,
      barbeiro_id: null,
      confirmado_por: userId,
      confirmado_em: new Date().toISOString(),
    })
    .eq('barbearia_id', barbeariaId)
    .eq('nome_origem', nomeOrigem)

  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/dashboard/importar-relatorio')
  return { ok: true }
}

/**
 * Desfaz uma decisão: o nome volta a ser pendente.
 *
 * Existe porque toda decisão de uma linha só deve ter volta — vincular ao
 * barbeiro errado mandaria o faturamento de um pra conta do outro, e sem
 * desfazer o dono teria que mexer no banco.
 */
export async function reabrirDePara(nomeOrigem: string) {
  const { supabase, barbeariaId } = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('import_agenda_depara')
    .update({ barbeiro_id: null, ignorar: false, confirmado_por: null, confirmado_em: null })
    .eq('barbearia_id', barbeariaId)
    .eq('nome_origem', nomeOrigem)

  if (error) return { error: 'Não foi possível reabrir.' }

  revalidatePath('/dashboard/importar-relatorio')
  return { ok: true }
}

/**
 * Cadastra um nome à mão, sem esperar a próxima importação.
 *
 * A lista desta tela é alimentada pela importação: só ela sabe quais nomes o
 * Agenda Serviço manda. Isso deixa um buraco no primeiro uso — o dono abre a
 * tela, vê vazio, e não tem o que fazer até rodar uma importação. Aqui ele
 * adianta o vínculo de um nome que já sabe que aparece.
 *
 * `barbeiroId` nulo grava como "não é ninguém" — serve pra linha de total, o
 * nome da própria casa, um serviço avulso.
 */
export async function vincularNomeManual(nomeDigitado: string, barbeiroId: string | null) {
  const { supabase, barbeariaId, userId } = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Não autenticado.' }

  const nomeExibicao = String(nomeDigitado ?? '').trim().slice(0, 200)
  if (nomeExibicao.length < 1) return { error: 'Digite o nome como ele aparece no relatório.' }

  // A chave é o nome normalizado, a MESMA normalização que a importação usa.
  // Se as duas divergissem, o vínculo cadastrado aqui nunca seria encontrado
  // lá — e o dono veria o nome voltar pra fila depois de já ter resolvido.
  const nomeOrigem = normalizarNome(nomeExibicao)
  if (!nomeOrigem) return { error: 'Esse nome não tem nenhuma letra ou número.' }

  if (barbeiroId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: barbeiro } = await (supabase as any)
      .from('barbeiros').select('id, ativo')
      .eq('id', barbeiroId).eq('barbearia_id', barbeariaId).maybeSingle() as
      { data: { id: string; ativo: boolean } | null }
    if (!barbeiro) return { error: 'Profissional não encontrado nesta barbearia.' }
    if (!barbeiro.ativo) return { error: 'Esse profissional está desativado. Reative antes de vincular.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('import_agenda_depara')
    .upsert({
      barbearia_id: barbeariaId,
      nome_origem: nomeOrigem,
      nome_exibicao: nomeExibicao,
      barbeiro_id: barbeiroId,
      ignorar: barbeiroId === null,
      confirmado_por: userId,
      confirmado_em: new Date().toISOString(),
    }, { onConflict: 'barbearia_id,nome_origem' })

  if (error) return { error: 'Não foi possível salvar o vínculo.' }

  revalidatePath('/dashboard/importar-relatorio')
  return { ok: true }
}
