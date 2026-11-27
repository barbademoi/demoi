import { consultarLeads, type FiltrosLead } from '@/lib/leads'
import { requireAdmin } from '@/lib/auth'
import { lerConfig } from '@/lib/settings'
import { MSG_LEAD_PADRAO } from '@/lib/defaults'
import { dataHoraBR, formatarWhatsapp } from '@/lib/format'
import { DISPOSICAO, DOR, FATURAMENTO, ORIGEM, PERFIL, STATUS_LEAD, rotulo } from '@/lib/opcoes'
import StatusLead from './StatusLead'
import BotaoWhatsLead from './BotaoWhatsLead'
import NotasLead from './NotasLead'

export default async function Leads({ searchParams }: { searchParams: FiltrosLead }) {
  const { supabase } = await requireAdmin()
  const f: FiltrosLead = {
    q: searchParams.q || undefined,
    perfil: searchParams.perfil || undefined,
    disposicao: searchParams.disposicao || undefined,
    faturamento: searchParams.faturamento || undefined,
    cidade: searchParams.cidade || undefined,
    status: searchParams.status || undefined,
  }
  const [{ data: leads, error }, modelo, { data: contagem }] = await Promise.all([
    consultarLeads(supabase, f),
    lerConfig('msg_lead', MSG_LEAD_PADRAO),
    supabase.from('mdc_leads').select('status'),
  ])

  const total = contagem?.length ?? 0
  const porStatus = Object.fromEntries(STATUS_LEAD.map((s) => [s.valor, contagem?.filter((c) => c.status === s.valor).length ?? 0]))
  const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Lista de espera</h1>
          <p className="text-suave">
            {total} no total · {STATUS_LEAD.map((s) => `${porStatus[s.valor]} ${s.rotulo.toLowerCase()}`).join(' · ')}
          </p>
        </div>
        <a href={`/admin/leads/csv?${params}`} className="btn-sm border border-linha hover:border-latao/60">
          ⬇ Exportar CSV {leads ? `(${leads.length})` : ''}
        </a>
      </div>

      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <input name="q" defaultValue={f.q} placeholder="Buscar nome, WhatsApp, Instagram" className="campo py-2.5 sm:col-span-3 lg:col-span-2" />
        <input name="cidade" defaultValue={f.cidade} placeholder="Cidade" className="campo py-2.5" />
        <Filtro nome="perfil" valor={f.perfil} opcoes={PERFIL} vazio="Perfil" />
        <Filtro nome="disposicao" valor={f.disposicao} opcoes={DISPOSICAO} vazio="Disposto a investir" />
        <Filtro nome="faturamento" valor={f.faturamento} opcoes={FATURAMENTO} vazio="Faturamento" />
        <Filtro nome="status" valor={f.status} opcoes={STATUS_LEAD} vazio="Status" />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button className="btn-sm bg-latao text-fundo">Filtrar</button>
          <a href="/admin/leads" className="btn-sm border border-linha">Limpar</a>
        </div>
      </form>

      {error && <p className="rounded-xl bg-perigo/10 p-4 text-perigo">Erro ao carregar: {error.message}</p>}
      {leads && leads.length === 0 && <p className="card p-6 text-center text-suave">Nenhum lead encontrado.</p>}

      <ul className="space-y-3">
        {leads?.map((l) => (
          <li key={l.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold">{l.nome}</p>
                <p className="text-suave">
                  {formatarWhatsapp(l.whatsapp)} · {l.cidade}/{l.uf}
                  {l.instagram && (
                    <>
                      {' · '}
                      <a href={`https://instagram.com/${l.instagram}`} target="_blank" rel="noreferrer" className="text-latao">
                        @{l.instagram}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusLead id={l.id} status={l.status} />
                <BotaoWhatsLead id={l.id} nome={l.nome} whatsapp={l.whatsapp} modelo={modelo} />
              </div>
            </div>

            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Item r="Perfil" v={rotulo(PERFIL, l.perfil)} />
              <Item r="Disposto a investir" v={rotulo(DISPOSICAO, l.disposicao)} destaque={l.disposicao === 'sim'} />
              <Item r="Faturamento" v={rotulo(FATURAMENTO, l.faturamento)} />
              <Item r="Barbeiros" v={l.num_barbeiros?.toString()} />
              <Item r="Maior dor" v={l.dor === 'outro' ? `Outro: ${l.dor_outro ?? ''}` : rotulo(DOR, l.dor)} />
              <Item r="Conheceu por" v={rotulo(ORIGEM, l.origem)} />
              <Item r="Entrou em" v={dataHoraBR(l.created_at)} />
              {l.utm && <Item r="Origem (UTM)" v={Object.values(l.utm).join(' / ')} />}
            </dl>
            <NotasLead id={l.id} notas={l.notas ?? ''} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Filtro({ nome, valor, opcoes, vazio }: { nome: string; valor?: string; opcoes: { valor: string; rotulo: string }[]; vazio: string }) {
  return (
    <select name={nome} defaultValue={valor ?? ''} className="campo py-2.5">
      <option value="">{vazio}: todos</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>{o.rotulo}</option>
      ))}
    </select>
  )
}

function Item({ r, v, destaque }: { r: string; v?: string | null; destaque?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-suave">{r}:</dt>
      <dd className={destaque ? 'font-semibold text-ok' : ''}>{v || '—'}</dd>
    </div>
  )
}
