import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { categoriaPorKey, type PassoTutorial } from '@/lib/tutoriais'
import EditarClient from './EditarClient'

export const dynamic = 'force-dynamic'

export default async function EditarTutorialPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) redirect('/onboarding')

  const { data: t } = await supabase
    .from('tutoriais')
    .select('id, categoria, titulo, descricao_curta')
    .eq('id', params.id)
    .maybeSingle()
  if (!t) notFound()

  const { data: passosData } = await supabase
    .from('tutorial_passos')
    .select('id, numero, titulo, conteudo, dica')
    .eq('tutorial_id', params.id)
    .order('numero')
  const passos: PassoTutorial[] = (passosData ?? []).map((p) => ({
    id: p.id as string,
    numero: p.numero as number,
    titulo: (p.titulo as string | null) ?? null,
    conteudo: p.conteudo as string,
    dica: (p.dica as string | null) ?? null,
  }))

  const cat = categoriaPorKey(t.categoria as string)

  return (
    <EditarClient
      id={t.id as string}
      tituloInicial={t.titulo as string}
      descricaoInicial={(t.descricao_curta as string | null) ?? ''}
      categoriaNome={cat?.nome ?? '—'}
      passosIniciais={passos}
    />
  )
}
