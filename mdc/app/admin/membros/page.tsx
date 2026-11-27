import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { dataBR, formatarWhatsapp, hojeSP } from '@/lib/format'
import { semanaDoMembro, statusExibido, STATUS_EXIBIDO, type Membro, type StatusExibido } from '@/lib/membro'
import { plano } from '@/lib/planos'
import { progressoMesTodos } from '@/lib/progresso-admin'

export default async function Membros({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const { supabase } = await requireAdmin()
  const [{ data }, { data: enviados }] = await Promise.all([
    supabase.from('members').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('member_id').eq('status', 'enviado'),
  ])
  const hoje = hojeSP()
  const comComprovante = new Set((enviados ?? []).map((p) => p.member_id))
  const todos = ((data as Membro[]) ?? []).map((m) => ({ ...m, st: statusExibido(m, hoje), semana: semanaDoMembro(m.data_inicio, hoje) }))
  const pct = await progressoMesTodos(createAdminClient(), todos.filter((m) => m.st === 'ativo' || m.st === 'vence_em_breve'))

  const q = (searchParams.q ?? '').toLowerCase().trim()
  const lista = todos.filter(
    (m) =>
      (!searchParams.status || (searchParams.status === 'comprovante' ? comComprovante.has(m.id) : m.st === searchParams.status)) &&
      (!q || `${m.nome} ${m.email} ${m.whatsapp} ${m.cidade ?? ''}`.toLowerCase().includes(q)),
  )
  const contar = (s: StatusExibido) => todos.filter((m) => m.st === s).length

  return (
    <div>
      <h1 className="text-2xl font-black">Membros e pagamentos</h1>
      <p className="mb-5 text-suave">{todos.length} contas · {contar('ativo') + contar('vence_em_breve')} com acesso</p>

      {comComprovante.size > 0 && (
        <Link href="/admin/membros?status=comprovante" className="card mb-5 flex items-center justify-between border-latao p-4">
          <span className="font-bold text-latao">{comComprovante.size} comprovante(s) esperando confirmação</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Aba href="/admin/membros" ativo={!searchParams.status} rotulo={`Todos (${todos.length})`} />
        <Aba href="/admin/membros?status=comprovante" ativo={searchParams.status === 'comprovante'} rotulo={`Com comprovante (${comComprovante.size})`} />
        {(Object.keys(STATUS_EXIBIDO) as StatusExibido[]).map((s) => (
          <Aba key={s} href={`/admin/membros?status=${s}`} ativo={searchParams.status === s} rotulo={`${STATUS_EXIBIDO[s].rotulo} (${contar(s)})`} />
        ))}
      </div>

      <form className="mb-4">
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <input name="q" defaultValue={searchParams.q} placeholder="Buscar nome, e-mail, WhatsApp, cidade" className="campo py-2.5" />
      </form>

      {lista.length === 0 && <p className="card p-6 text-center text-suave">Ninguém aqui.</p>}

      <ul className="space-y-3">
        {lista.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/membros/${m.id}`} className="card block p-4 transition hover:border-latao/60">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold">
                    {m.nome}
                    {m.fundador && <span className="ml-2 rounded-full bg-latao/15 px-2 py-0.5 text-xs font-bold text-latao">Fundador</span>}
                    {m.convidado && <span className="ml-2 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-bold text-sky-300">Convidado</span>}
                  </p>
                  <p className="text-sm text-suave">{formatarWhatsapp(m.whatsapp)} · {m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {comComprovante.has(m.id) && <span className="rounded-full bg-latao px-2.5 py-1 text-xs font-bold text-fundo">Comprovante</span>}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_EXIBIDO[m.st].cor}`}>{STATUS_EXIBIDO[m.st].rotulo}</span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-6">
                <Info r="Plano" v={plano(m.plano)?.curto ?? m.plano} />
                <Info r="Início" v={dataBR(m.data_inicio)} />
                <Info r="Vencimento" v={dataBR(m.vencimento)} />
                <Info r="Semana" v={m.semana ? String(m.semana) : '—'} />
                <Info r="Perfil" v={m.perfil === 'equipe' ? 'Com equipe' : m.perfil === 'sozinho' ? 'Sozinho' : '—'} />
                <Info r="Missões no mês" v={pct[m.id] !== undefined ? `${pct[m.id]}%` : '—'} />
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Aba({ href, ativo, rotulo }: { href: string; ativo: boolean; rotulo: string }) {
  return (
    <Link href={href} className={`btn-sm shrink-0 border ${ativo ? 'border-latao bg-latao text-fundo' : 'border-linha text-suave'}`}>
      {rotulo}
    </Link>
  )
}

function Info({ r, v }: { r: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-suave">{r}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  )
}
