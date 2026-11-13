import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

/** Inscrição vinda do navegador (PushSubscription.toJSON()). */
export type InscricaoNavegador = { endpoint?: string; keys?: { p256dh?: string; auth?: string } }

/** Valida o formato da inscrição do navegador. */
export function validarInscricao(s: InscricaoNavegador): { endpoint: string; p256dh: string; auth: string } | null {
  const endpoint = String(s?.endpoint ?? '')
  const p256dh = String(s?.keys?.p256dh ?? '')
  const auth = String(s?.keys?.auth ?? '')
  if (!/^https:\/\/[^\s]{10,1000}$/.test(endpoint)) return null
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) return null
  return { endpoint, p256dh, auth }
}

/**
 * Grava a inscrição deste aparelho para um dono OU um colaborador.
 * Se o mesmo aparelho já estava inscrito para outra pessoa, passa para quem
 * está usando agora (o endpoint é único por navegador).
 */
export async function gravarInscricao(
  dono: { empresa_id: string; dono_id?: string; colaborador_id?: string },
  sub: InscricaoNavegador,
  navegador: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const v = validarInscricao(sub)
  if (!v) return { ok: false, erro: 'Não consegui ativar neste aparelho.' }
  const { error } = await createTarefixAdmin()
    .from('push_inscricoes')
    .upsert(
      {
        empresa_id: dono.empresa_id,
        dono_id: dono.dono_id ?? null,
        colaborador_id: dono.colaborador_id ?? null,
        endpoint: v.endpoint,
        p256dh: v.p256dh,
        auth: v.auth,
        navegador: navegador.slice(0, 200),
      },
      { onConflict: 'endpoint' }
    )
  if (error) return { ok: false, erro: 'Não consegui salvar a inscrição. Tente de novo.' }
  return { ok: true }
}

export async function apagarInscricao(endpoint: string, filtro: { dono_id?: string; colaborador_id?: string }) {
  let q = createTarefixAdmin().from('push_inscricoes').delete().eq('endpoint', String(endpoint).slice(0, 1000))
  if (filtro.dono_id) q = q.eq('dono_id', filtro.dono_id)
  if (filtro.colaborador_id) q = q.eq('colaborador_id', filtro.colaborador_id)
  await q
}
