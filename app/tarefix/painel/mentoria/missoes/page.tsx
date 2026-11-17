import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirDono } from '@/lib/tarefix/dono'
import { ehAdmin } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { hojeSP } from '@/lib/tarefix/datas'
import type { Missao } from '@/lib/tarefix/mentoria'
import { Titulo } from '@/components/tarefix/ui'
import { Biblioteca } from './Biblioteca'

export const metadata = { title: 'Biblioteca de missões' }
export const dynamic = 'force-dynamic'

export default async function PaginaBiblioteca() {
  const { userId, empresa } = await exigirDono()
  if (!(await ehAdmin(userId))) notFound()
  const db = createTarefixAdmin()
  const [{ data: missoes }, { data: mentorados }] = await Promise.all([
    db.from('missoes').select('*').eq('empresa_id', empresa.id).order('criado_em', { ascending: false }),
    db.from('mentorados').select('id, nome, ativo').eq('empresa_id', empresa.id).order('nome'),
  ])
  const ids = (missoes ?? []).map((m) => m.id)
  const { data: atrib } = ids.length ? await db.from('missoes_mentorados').select('missao_id, mentorado_id').in('missao_id', ids) : { data: [] as { missao_id: string; mentorado_id: string }[] }
  return (
    <div className="space-y-5">
      <Link href="/tarefix/painel/mentoria" className="inline-flex min-h-[44px] items-center text-sm font-bold text-tf-suave">
        ‹ Mentoria
      </Link>
      <Titulo>Biblioteca de missões</Titulo>
      <p className="-mt-3 text-tf-suave">Todas as missões que você criou. Edite, vincule a outros mentorados ou duplique para fazer uma variação.</p>
      <Biblioteca
        missoes={((missoes ?? []) as Missao[]).map((m) => ({ ...m, para: (atrib ?? []).filter((a) => a.missao_id === m.id).map((a) => a.mentorado_id) }))}
        mentorados={mentorados ?? []}
        hoje={hojeSP()}
      />
    </div>
  )
}
