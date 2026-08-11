'use server'

import { createClient } from '@/lib/supabase/server'

export type ResultadoPopup = { ok?: true; error?: string }

/** Fechou no X: some por uma semana. */
const DIAS_ADIAMENTO = 7
/** Disse que não quer: some por meio ano. Não é "pra sempre" só porque a
 *  oferta muda com o tempo — mas é longe o bastante pra não ser insistência. */
const DIAS_SEM_INTERESSE = 180

async function gravar(patch: Record<string, unknown>): Promise<ResultadoPopup> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Escreve com o client DO USUÁRIO: a policy já prende usuario_id = auth.uid(),
  // então não dá pra silenciar o popup de outra pessoa nem por engano.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('brindoleta_popup_estado')
    .upsert(
      { usuario_id: user.id, atualizado_em: new Date().toISOString(), ...patch },
      { onConflict: 'usuario_id' },
    )

  if (error) {
    console.error('[brindoleta/popup] erro ao gravar estado:', error)
    return { error: 'Não foi possível salvar sua preferência.' }
  }
  return { ok: true }
}

function daquiADias(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString()
}

/** X ou "agora não": volta daqui a 7 dias. */
export async function adiarPopupBrindoleta(): Promise<ResultadoPopup> {
  return gravar({ adiado_ate: daquiADias(DIAS_ADIAMENTO) })
}

/** "Não tenho interesse": para de aparecer. */
export async function recusarPopupBrindoleta(): Promise<ResultadoPopup> {
  return gravar({ sem_interesse: true, adiado_ate: daquiADias(DIAS_SEM_INTERESSE) })
}

/**
 * Registra que apareceu. Serve pra eu saber quantas vezes a oferta foi vista
 * antes de alguém ativar — sem isso não dá pra dizer se o popup converte ou
 * só incomoda.
 */
export async function registrarExibicaoPopup(): Promise<ResultadoPopup> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: atual } = await db
    .from('brindoleta_popup_estado').select('vezes').eq('usuario_id', user.id).maybeSingle()

  return gravar({
    ultima_exibicao: new Date().toISOString(),
    vezes: (Number(atual?.vezes) || 0) + 1,
  })
}
