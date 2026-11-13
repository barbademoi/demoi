'use server'

import { revalidatePath } from 'next/cache'
import { donoOuErro, type Resultado } from '@/lib/tarefix/dono'
import { concederAcesso, ehAdmin, type ResultadoConcessao } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

export async function concederAcessoAcao(d: { nome: string; email: string; empresa: string }): Promise<ResultadoConcessao> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!(await ehAdmin(s.userId))) return { ok: false, erro: 'Só o administrador pode conceder acesso.' }
  const r = await concederAcesso(s.userId, d)
  revalidatePath('/tarefix/painel/acessos')
  return r
}

/** Suspende ou reativa a empresa de um mentorado (não vale para a própria). */
export async function definirAcessoAtivo(empresaId: string, ativo: boolean): Promise<Resultado> {
  const s = await donoOuErro()
  if ('ok' in s) return s
  if (!(await ehAdmin(s.userId))) return { ok: false, erro: 'Só o administrador pode mudar acessos.' }
  if (empresaId === s.empresa.id) return { ok: false, erro: 'Você não pode suspender a sua própria empresa.' }
  const { error } = await createTarefixAdmin().from('empresas').update({ ativo }).eq('id', empresaId)
  if (error) return { ok: false, erro: error.message }
  revalidatePath('/tarefix/painel/acessos')
  return { ok: true }
}
