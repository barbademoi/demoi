import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { categoriaPorKey, CATEGORIAS_TUTORIAL, type PassoTutorial, type CategoriaTutorial } from '@/lib/tutoriais'
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
    .select('id, categoria, titulo, descricao_curta, ativo, ordem')
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

  // Próximo tutorial: primeiro NÃO LIDO depois do atual na ordem global
  // (categoria → ordem). Se não houver nenhum à frente, volta procurando
  // do começo até o atual. Se nenhum não-lido sobrou, retorna null e o
  // cliente mostra "concluiu todos".
  const { data: todosTuts } = await supabase
    .from('tutoriais')
    .select('id, titulo, categoria, ordem')
    .eq('ativo', true)
  const { data: lidosAll } = await supabase
    .from('tutoriais_lidos')
    .select('tutorial_id')
    .eq('estabelecimento_id', est.id)
  const lidosSet = new Set((lidosAll ?? []).map((l) => l.tutorial_id as string))

  const ordemCategorias = CATEGORIAS_TUTORIAL.map((c) => c.key as string)
  const ordenados = [...(todosTuts ?? [])].sort((a, b) => {
    const ca = ordemCategorias.indexOf(a.categoria as string)
    const cb = ordemCategorias.indexOf(b.categoria as string)
    if (ca !== cb) return ca - cb
    return (a.ordem as number) - (b.ordem as number)
  })
  const idxAtual = ordenados.findIndex((c) => c.id === t.id)

  let proximo: { id: string; titulo: string } | null = null
  for (let i = idxAtual + 1; i < ordenados.length; i++) {
    if (!lidosSet.has(ordenados[i].id as string)) {
      proximo = { id: ordenados[i].id as string, titulo: ordenados[i].titulo as string }
      break
    }
  }
  if (!proximo) {
    for (let i = 0; i < idxAtual; i++) {
      if (!lidosSet.has(ordenados[i].id as string)) {
        proximo = { id: ordenados[i].id as string, titulo: ordenados[i].titulo as string }
        break
      }
    }
  }

  const cat = categoriaPorKey(t.categoria as string)

  return (
    <TutorialClient
      key={t.id as string}
      id={t.id as string}
      titulo={t.titulo as string}
      categoriaNome={cat?.nome ?? '—'}
      categoria={t.categoria as CategoriaTutorial}
      passos={passos}
      jaConcluido={!!lido}
      proximo={proximo}
    />
  )
}
