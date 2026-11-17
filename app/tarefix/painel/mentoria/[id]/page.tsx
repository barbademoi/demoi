import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirDono } from '@/lib/tarefix/dono'
import { ehAdmin } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { hojeSP } from '@/lib/tarefix/datas'
import { lerEntregas, noPrazo, proximaReuniao, type Mentorado, type Missao } from '@/lib/tarefix/mentoria'
import { DetalheMentorado } from './DetalheMentorado'

export const metadata = { title: 'Mentorado' }
export const dynamic = 'force-dynamic'

export default async function PaginaMentorado({ params, searchParams }: { params: { id: string }; searchParams: { novo?: string } }) {
  const { userId, empresa } = await exigirDono()
  if (!(await ehAdmin(userId))) notFound()
  const db = createTarefixAdmin()
  const { data: m } = await db.from('mentorados').select('*').eq('id', params.id).eq('empresa_id', empresa.id).maybeSingle()
  if (!m) notFound()
  const mentorado = m as Mentorado

  const [entregas, reuniao, { data: atrib }, { data: todos }] = await Promise.all([
    lerEntregas(mentorado.id, db),
    proximaReuniao(mentorado.id, db),
    db.from('missoes_mentorados').select('missao_id').eq('mentorado_id', mentorado.id),
    db.from('mentorados').select('id, nome').eq('empresa_id', empresa.id).eq('ativo', true).order('nome'),
  ])
  const ids = (atrib ?? []).map((a) => a.missao_id)
  const [{ data: missoes }, { data: para }] = ids.length
    ? await Promise.all([db.from('missoes').select('*').in('id', ids).order('criado_em', { ascending: false }), db.from('missoes_mentorados').select('missao_id, mentorado_id').in('missao_id', ids)])
    : [{ data: [] as Missao[] }, { data: [] as { missao_id: string; mentorado_id: string }[] }]

  // fotos das entregas (bucket privado → links temporários)
  const caminhos = entregas.map((e) => e.foto_path).filter((p): p is string => Boolean(p))
  const fotos: Record<string, string> = {}
  if (caminhos.length) {
    const { data: assinadas } = await db.storage.from('tarefix-provas').createSignedUrls(caminhos, 60 * 60)
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) fotos[a.path] = a.signedUrl
  }

  return (
    <div className="space-y-5">
      <Link href="/tarefix/painel/mentoria" className="inline-flex min-h-[44px] items-center text-sm font-bold text-tf-suave">
        ‹ Mentoria
      </Link>
      <DetalheMentorado
        mentorado={mentorado}
        novo={Boolean(searchParams.novo)}
        entregas={entregas.map((e) => ({ ...e, foto_url: e.foto_path ? fotos[e.foto_path] ?? null : null }))}
        prazo={noPrazo(entregas)}
        reuniao={reuniao}
        missoes={((missoes ?? []) as Missao[]).map((x) => ({ ...x, para: (para ?? []).filter((p) => p.missao_id === x.id).map((p) => p.mentorado_id) }))}
        todos={todos ?? []}
        hoje={hojeSP()}
      />
    </div>
  )
}
