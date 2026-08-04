import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { emailTemImportacao } from '@/lib/importacao/access'

export type AcessoImportacaoAgenda = {
  supabase: ReturnType<typeof createClient>
  usuarioId: string
  barbeariaId: string
  barbeariaNome: string
  diaFechamento: number
}

export async function obterAcessoImportacaoAgenda(): Promise<
  AcessoImportacaoAgenda | { error: string; status: number }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.', status: 401 }
  if (!emailTemImportacao(user.email ?? null)) {
    return { error: 'Sem acesso à importação em teste.', status: 403 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw, error } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(nome, dia_fechamento)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as {
    barbearia_id: string
    barbearias: { nome: string; dia_fechamento: number | null } | null
  } | null
  if (error || !usuario?.barbearias) {
    return { error: 'Barbearia não encontrada.', status: 404 }
  }

  return {
    supabase,
    usuarioId: user.id,
    barbeariaId: usuario.barbearia_id,
    barbeariaNome: usuario.barbearias.nome,
    diaFechamento: usuario.barbearias.dia_fechamento ?? 1,
  }
}
