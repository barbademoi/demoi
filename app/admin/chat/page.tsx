import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { avaliarAcesso } from '@/lib/assinatura/acesso'
import ChatAdminClient, {
  type ComunicadoAdmin,
  type ConversaResumo,
  type OpcaoBarbearia,
} from './ChatAdminClient'

export const metadata = { title: 'Admin — Chat' }
export const dynamic = 'force-dynamic'

export default async function AdminChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createAdminClient()

  const [comunicadosRes, mensagensRes, assinantesRes, configRes] = await Promise.all([
    db.from('chat_comunicados')
      .select('id, corpo, publicado_em, ativo')
      .order('publicado_em', { ascending: false }).limit(60),
    db.from('chat_suporte')
      .select('id, usuario_id, autor, corpo, criado_em, lido_em')
      .order('criado_em', { ascending: false }).limit(1000),
    db.from('usuarios')
      .select('id, email, tipo_acesso, status_assinatura, valido_ate, barbearia_id, barbearias(nome)')
      .eq('tipo_acesso', 'mensal'),
    db.from('chat_config').select('aviso_resposta').maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assinantes = (assinantesRes.data ?? []) as any[]
  const porId = new Map(assinantes.map((u) => [u.id as string, u]))
  const agora = new Date()

  // Agrupa as mensagens por conversa. Uma consulta só; agrupar aqui evita N+1
  // e mantém a lista ordenada por quem falou por último.
  const conversas = new Map<string, ConversaResumo>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of ((mensagensRes.data ?? []) as any[])) {
    const uid = m.usuario_id as string
    let c = conversas.get(uid)
    if (!c) {
      const u = porId.get(uid)
      const av = u ? avaliarAcesso(u, agora) : null
      c = {
        usuarioId: uid,
        email: (u?.email as string) ?? '(conta removida)',
        barbearia: (u?.barbearias?.nome as string) ?? '—',
        // Vitalício que escreveu antes de virar assinante, ou conta que
        // cancelou: o contexto precisa dizer isso, porque muda a resposta.
        assinaturaOk: av ? av.liberado && av.estado !== 'vitalicio' : false,
        estado: av?.estado ?? null,
        validoAte: (u?.valido_ate as string) ?? null,
        ultimaMensagem: m.corpo as string,
        ultimaEm: m.criado_em as string,
        ultimoAutor: m.autor as 'cliente' | 'admin',
        naoLidas: 0,
        total: 0,
      }
      conversas.set(uid, c)
    }
    c.total += 1
    if (m.autor === 'cliente' && m.lido_em === null) c.naoLidas += 1
  }

  const lista = Array.from(conversas.values()).sort((a, b) => {
    // Quem está esperando resposta primeiro; depois, quem falou mais recente.
    if ((b.naoLidas > 0 ? 1 : 0) !== (a.naoLidas > 0 ? 1 : 0)) return b.naoLidas - a.naoLidas
    return new Date(b.ultimaEm).getTime() - new Date(a.ultimaEm).getTime()
  })

  const comunicados: ComunicadoAdmin[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((comunicadosRes.data ?? []) as any[]).map((c) => ({
      id: c.id, corpo: c.corpo, publicadoEm: c.publicado_em, ativo: c.ativo,
    }))

  // Barbearias de assinantes ativos, pra prévia com dados reais.
  const opcoes: OpcaoBarbearia[] = assinantes
    .filter((u) => u.barbearia_id && avaliarAcesso(u, agora).liberado)
    .map((u) => ({ id: u.barbearia_id as string, nome: (u.barbearias?.nome as string) ?? u.email }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">← Voltar para o painel</Link>

        <div className="mb-6 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Chat dos assinantes</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            O comunicado é uma mensagem só, que todos os assinantes ativos veem com os próprios números.
            O suporte é conversa 1-a-1. Vitalícios não têm acesso ao chat.
          </p>
        </div>

        <ChatAdminClient
          comunicados={comunicados}
          conversas={lista}
          barbearias={opcoes}
          avisoInicial={(configRes.data?.aviso_resposta as string) ?? ''}
        />
      </div>
    </main>
  )
}
