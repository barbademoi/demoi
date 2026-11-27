import Link from 'next/link'
import Barra from '@/components/app/Barra'
import { requireMembro } from '@/lib/membro'
import { lerConfig } from '@/lib/settings'
import { LINKS_PADRAO } from '@/lib/defaults'
import { assinar, posicaoNoCiclo, youtubeId, type Ciclo } from '@/lib/conteudo'
import { dataBR, diasEntre, hojeSP } from '@/lib/format'

export default async function Inicio({ searchParams }: { searchParams: { 'boas-vindas'?: string; reavaliacao?: string } }) {
  const { supabase, user, membro, semana, status } = await requireMembro()
  const { nivel, semanaCiclo } = posicaoNoCiclo(semana)

  const [links, { data: ciclo }, { data: ultimo }, { data: prog }, { count: fez90 }] = await Promise.all([
    lerConfig('links_membros', LINKS_PADRAO),
    supabase.from('mdc_ciclo').select('*').eq('semana', semanaCiclo).maybeSingle(),
    supabase.from('mdc_meetings').select('*').eq('is_ultimo', true).maybeSingle(),
    supabase.rpc('mdc_meu_progresso').maybeSingle(),
    supabase.from('mdc_diagnosticos').select('id', { count: 'exact', head: true }).eq('member_id', user.id).eq('tipo', '90dias'),
  ])
  const c = ciclo as Ciclo | null
  const p = (prog as { hoje: number; semana: number; mes: number; hoje_prev: number; hoje_feitos: number } | null) ?? null
  const urls = await assinar([ultimo?.pdf_path])
  const yt = youtubeId(ultimo?.youtube_url)
  const faltam = membro.vencimento ? diasEntre(hojeSP(), membro.vencimento) : 0

  return (
    <div className="space-y-5">
      {searchParams['boas-vindas'] && (
        <div className="rounded-2xl bg-ok/10 p-4 text-ok">Diagnóstico recebido! Agora é mão na massa. 💪</div>
      )}
      {searchParams.reavaliacao && <div className="rounded-2xl bg-ok/10 p-4 text-ok">Reavaliação recebida. Obrigado!</div>}

      <section>
        <p className="text-suave">Oi, {membro.nome.split(' ')[0]}!</p>
        {semana > 0 ? (
          <>
            <h1 className="text-4xl font-black">Semana {semana}</h1>
            <p className="mt-1 text-lg">
              {nivel > 1 && <span className="mr-2 rounded-full bg-latao/15 px-2 py-0.5 text-sm font-bold text-latao">Nível {nivel}</span>}
              Pilar: <strong className="text-latao">{c?.pilar ?? '—'}</strong>
              {c?.tema && <span className="text-suave"> · {c.tema}</span>}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black">Falta pouco!</h1>
            <p className="mt-1 text-lg text-suave">Sua semana 1 começa em {dataBR(membro.data_inicio)}.</p>
          </>
        )}
      </section>

      {status === 'vence_em_breve' && (
        <Link href="/renovar" className="card flex items-center justify-between border-alerta p-4">
          <span>
            <strong className="text-alerta">Seu plano vence {faltam === 0 ? 'hoje' : `em ${faltam} dia${faltam > 1 ? 's' : ''}`}</strong>
            <span className="block text-sm text-suave">Renove pra não perder o acesso.</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {semana >= 13 && !fez90 && (
        <Link href="/app/reavaliacao" className="card flex items-center justify-between border-latao p-4">
          <span>
            <strong className="text-latao">Reavaliação de 90 dias liberada</strong>
            <span className="block text-sm text-suave">5 minutos pra ver o quanto sua barbearia andou.</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {semana > 0 && (
        <section className="card space-y-4 p-5">
          <Barra rotulo="Hoje" pct={p?.hoje ?? 0} detalhe={p ? `${p.hoje_feitos} de ${p.hoje_prev} hábitos` : undefined} />
          <Barra rotulo="Semana" pct={p?.semana ?? 0} />
          <Barra rotulo="Mês" pct={p?.mes ?? 0} />
          <Link href="/app/missoes" className="btn-primario w-full sm:w-full">Missões de hoje</Link>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {links.meet_url ? (
          <a href={links.meet_url} target="_blank" rel="noopener noreferrer" className="card block p-5 hover:border-latao/60">
            <p className="text-sm text-suave">Encontro ao vivo</p>
            <p className="text-lg font-bold">Segunda, 15h às 17h</p>
            <p className="mt-2 font-semibold text-latao">Entrar no Google Meet →</p>
          </a>
        ) : (
          <div className="card p-5">
            <p className="text-sm text-suave">Encontro ao vivo</p>
            <p className="text-lg font-bold">Segunda, 15h às 17h</p>
            <p className="mt-2 text-sm text-suave">O link sai no grupo.</p>
          </div>
        )}
        {links.grupo_membros_url && (
          <a href={links.grupo_membros_url} target="_blank" rel="noopener noreferrer" className="card block p-5 hover:border-latao/60">
            <p className="text-sm text-suave">Grupo dos membros</p>
            <p className="text-lg font-bold">WhatsApp do MDC</p>
            <p className="mt-2 font-semibold text-[#25D366]">Abrir o grupo →</p>
          </a>
        )}
      </section>

      <section className="card p-5">
        <p className="text-sm text-suave">Último encontro</p>
        {ultimo ? (
          <>
            <h2 className="text-xl font-bold">{ultimo.tema}</h2>
            <p className="text-sm text-suave">{dataBR(ultimo.data)}</p>
            {yt && (
              <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${yt}`}
                  title={ultimo.tema}
                  className="h-full w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {ultimo.pdf_path && urls[ultimo.pdf_path] && (
                <a href={urls[ultimo.pdf_path]} target="_blank" rel="noreferrer" className="btn-secundario">📄 Resumo em PDF</a>
              )}
              {ultimo.youtube_url && (
                <a href={ultimo.youtube_url} target="_blank" rel="noreferrer" className="btn-secundario">▶ Abrir no YouTube</a>
              )}
            </div>
          </>
        ) : (
          <p className="mt-1 text-suave">O resumo do primeiro encontro aparece aqui.</p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <a href={links.barbermeta_url || '#'} target="_blank" rel="noopener noreferrer" className="card block p-5 text-center hover:border-latao/60">
          <p className="text-lg font-black">BarberMeta</p>
          <p className="text-sm text-suave">Metas da equipe</p>
        </a>
        <a href={links.tarefix_url || '#'} target="_blank" rel="noopener noreferrer" className="card block p-5 text-center hover:border-latao/60">
          <p className="text-lg font-black">Tarefix</p>
          <p className="text-sm text-suave">Tarefas do dia</p>
        </a>
      </section>
    </div>
  )
}
