import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Links assinados (temporários) para arquivos do bucket privado "conteudo".
 * IMPORTANTE: só chame com caminhos que vieram de uma consulta feita com o
 * cliente do MEMBRO — é o RLS dessa consulta que garante que a semana está
 * liberada. Aqui só se assina o que já passou por ele.
 */
export async function assinar(paths: (string | null | undefined)[], segundos = 60 * 60 * 3): Promise<Record<string, string>> {
  const lista = Array.from(new Set(paths.filter((p): p is string => !!p)))
  if (!lista.length) return {}
  const { data } = await createAdminClient().storage.from('mdc-conteudo').createSignedUrls(lista, segundos)
  const out: Record<string, string> = {}
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl
  return out
}

/** ID do vídeo do YouTube a partir de qualquer formato de link. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)
  return m ? m[1] : null
}

export type Ciclo = { semana: number; tema: string; pilar: string }

/** Semana do ciclo (1–13) e nível a partir da semana do membro. */
export function posicaoNoCiclo(semanaMembro: number) {
  if (semanaMembro < 1) return { nivel: 1, semanaCiclo: 1 }
  return { nivel: Math.floor((semanaMembro - 1) / 13) + 1, semanaCiclo: ((semanaMembro - 1) % 13) + 1 }
}
