import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { categoriaPorKey, type PassoTutorial, type CategoriaTutorial } from '@/lib/tutoriais'
import TutorialClient from './TutorialClient'

export const dynamic = 'force-dynamic'

export default async function TutorialPage({ params }: { params: { id: string } }) {
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
    .select('id, categoria, titulo, descricao_curta, ativo')
    .eq('id', params.id)
    .maybeSingle()
  if (!t || !t.ativo) notFound()

  const { data: passosData } = await supabase
    .from('tutorial_passos')
    .select('id, numero, titulo, conteudo, dica')
    .eq('tutorial_id', params.id)
    .order('numero', { ascending: true })

  const passos: PassoTutorial[] = (passosData ?? []).map((p) => ({
    id: p.id as string,
    numero: p.numero as number,
    titulo: (p.titulo as string | null) ?? null,
    conteudo: p.conteudo as string,
    dica: (p.dica as string | null) ?? null,
  }))

  const { data: lido } = await supabase
    .from('tutoriais_lidos')
    .select('id')
    .eq('estabelecimento_id', est.id)
    .eq('tutorial_id', params.id)
    .maybeSingle()

  // Próximo tutorial da mesma categoria pra sugerir ao concluir.
  const { data: proximo } = await supabase
    .from('tutoriais')
    .select('id, titulo, ordem')
    .eq('ativo', true)
    .eq('categoria', t.categoria)
    .gt('ordem', 0)
    .neq('id', t.id)
    .order('ordem', { ascending: true })
    .limit(50)
  const proxLista = (proximo ?? []) as { id: string; titulo: string; ordem: number }[]

  const cat = categoriaPorKey(t.categoria as string)

  return (
    <TutorialClient
      id={t.id as string}
      titulo={t.titulo as string}
      categoriaNome={cat?.nome ?? '—'}
      categoria={t.categoria as CategoriaTutorial}
      passos={passos}
      jaConcluido={!!lido}
      proximos={proxLista.map((p) => ({ id: p.id, titulo: p.titulo }))}
    />
  )
}
