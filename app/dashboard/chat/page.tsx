import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { ehAssinanteAtivo, buscarContextoChat } from '@/lib/chat/acesso'
import { renderizarComunicado, type ContextoChat } from '@/lib/chat/marcadores'
import ChatClient, { type ComunicadoExibido, type MensagemSuporte } from './ChatClient'

export const metadata = { title: 'Chat — BarberMeta' }
export const dynamic = 'force-dynamic'

/**
 * CHAT DO ASSINANTE — comunicados (um → todos) e suporte (1-a-1).
 *
 * A trava de acesso é dupla de propósito: este redirect evita a tela vazia e
 * confusa, mas quem realmente protege os dados é o RLS. Mesmo que alguém
 * contorne esta linha, as policies não devolvem linha nenhuma.
 */
export default async function ChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!(await ehAssinanteAtivo(supabase))) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string } | null } | null }
  if (!usuario?.barbearias) redirect('/dashboard')

  const [contextoRaw, comunicadosRes, leiturasRes, suporteRes, configRes] = await Promise.all([
    buscarContextoChat(supabase, usuario.barbearia_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('chat_comunicados')
      .select('id, corpo, publicado_em')
      .order('publicado_em', { ascending: false })
      .limit(60),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('chat_comunicado_leituras').select('comunicado_id'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('chat_suporte')
      .select('id, autor, corpo, criado_em, lido_em')
      .order('criado_em', { ascending: true })
      .limit(400),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('chat_config').select('aviso_resposta').maybeSingle(),
  ])

  const contexto = (contextoRaw ?? {}) as Partial<ContextoChat>
  const lidos = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((leiturasRes.data ?? []) as any[]).map((l) => l.comunicado_id as string),
  )

  // O texto é personalizado AQUI, na exibição — cada assinante recebe a mesma
  // mensagem base com os SEUS números. Nada é gravado personalizado, senão
  // corrigir um comunicado exigiria reescrever N cópias.
  const comunicados: ComunicadoExibido[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((comunicadosRes.data ?? []) as any[]).map((c) => ({
      id: c.id as string,
      texto: renderizarComunicado(String(c.corpo ?? ''), contexto).texto,
      publicadoEm: c.publicado_em as string,
      lido: lidos.has(c.id as string),
    }))

  const mensagens: MensagemSuporte[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((suporteRes.data ?? []) as any[]).map((m) => ({
      id: m.id as string,
      autor: m.autor as 'cliente' | 'admin',
      corpo: m.corpo as string,
      criadoEm: m.criado_em as string,
      lido: m.lido_em !== null,
    }))

  const aviso = (configRes.data?.aviso_resposta as string | undefined)
    ?? 'Respondo em até 1 dia útil, de segunda a sexta.'

  return (
    <div className="bm-theme min-h-screen flex">
      <Sidebar barbeariaNome={usuario.barbearias.nome} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 lg:pl-[calc(16rem+2rem)] lg:pr-8 lg:pt-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Exclusivo de assinante</p>
            <h1 className="mt-2 font-serif text-3xl text-text sm:text-4xl">Chat</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              Recados do BarberMeta e canal direto com o suporte.
            </p>
          </div>

          <ChatClient
            comunicados={comunicados}
            mensagens={mensagens}
            avisoResposta={aviso}
          />
        </div>
      </main>
    </div>
  )
}
