import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { dataBR, dataHoraBR, formatarWhatsapp, hojeSP, reais } from '@/lib/format'
import { semanaDoMembro, statusExibido, STATUS_EXIBIDO, type Membro } from '@/lib/membro'
import { plano } from '@/lib/planos'
import { ETAPAS_90DIAS, ETAPAS_ENTRADA, respostaLegivel, type Respostas } from '@/lib/diagnostico'
import FormConfirmar from './FormConfirmar'
import FormMembro from './FormMembro'
import BotaoRecusar from './BotaoRecusar'

type Pagamento = {
  id: string
  created_at: string
  plano: string
  comprovante_path: string | null
  status: string
  valor: number | null
  forma: string | null
  pago_em: string | null
  periodo_inicio: string | null
  periodo_fim: string | null
  observacao: string | null
}

export default async function MembroDetalhe({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin()
  const [{ data: m }, { data: pags }, { data: termos }, { data: diags }] = await Promise.all([
    supabase.from('mdc_members').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('mdc_payments').select('*').eq('member_id', params.id).order('created_at', { ascending: false }),
    supabase.from('mdc_terms_acceptances').select('*').eq('member_id', params.id).order('aceito_em', { ascending: false }),
    supabase.from('mdc_diagnosticos').select('*').eq('member_id', params.id),
  ])
  if (!m) notFound()
  const membro = m as Membro
  const pagamentos = (pags as Pagamento[]) ?? []

  // Links assinados (valem 1 hora) para ver os comprovantes do bucket privado.
  const admin = createAdminClient()
  const links: Record<string, string> = {}
  await Promise.all(
    pagamentos
      .filter((p) => p.comprovante_path)
      .map(async (p) => {
        const { data } = await admin.storage.from('mdc-comprovantes').createSignedUrl(p.comprovante_path!, 3600)
        if (data?.signedUrl) links[p.id] = data.signedUrl
      }),
  )

  const st = statusExibido(membro)
  const hoje = hojeSP()
  const entrada = (diags ?? []).find((d) => d.tipo === 'entrada')?.respostas as Respostas | undefined
  const noventa = (diags ?? []).find((d) => d.tipo === '90dias')?.respostas as Respostas | undefined
  const p = plano(membro.plano)
  const inicioSugerido = membro.fundador ? '2027-01-18' : hoje

  return (
    <div className="space-y-6">
      <Link href="/admin/membros" className="text-sm text-suave">← Membros</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{membro.nome}</h1>
          <p className="text-suave">
            {formatarWhatsapp(membro.whatsapp)} · {membro.email}
            {membro.cidade && ` · ${membro.cidade}/${membro.uf ?? ''}`}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-bold ${STATUS_EXIBIDO[st].cor}`}>{STATUS_EXIBIDO[st].rotulo}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Box r="Plano" v={p?.nome ?? membro.plano} />
        <Box r="Início" v={dataBR(membro.data_inicio)} />
        <Box r="Vencimento" v={dataBR(membro.vencimento)} />
        <Box r="Semana atual" v={membro.data_inicio ? String(semanaDoMembro(membro.data_inicio, hoje)) : '—'} />
      </div>

      {/* Comprovantes aguardando */}
      {pagamentos.filter((x) => x.status === 'enviado').map((x) => (
        <section key={x.id} className="card border-latao p-5">
          <h2 className="text-xl font-bold text-latao">Comprovante para confirmar</h2>
          <p className="mt-1 text-sm text-suave">Enviado em {dataHoraBR(x.created_at)} · plano escolhido: {plano(x.plano)?.nome}</p>
          {links[x.id] && (
            <a href={links[x.id]} target="_blank" rel="noreferrer" className="btn-sm mt-3 border border-latao text-latao">
              Ver comprovante ↗
            </a>
          )}
          <FormConfirmar
            memberId={membro.id}
            paymentId={x.id}
            planoInicial={x.plano}
            primeiraVez={!membro.data_inicio}
            inicioSugerido={inicioSugerido}
            hoje={hoje}
          />
          <BotaoRecusar paymentId={x.id} />
        </section>
      ))}

      <details className="card p-5">
        <summary className="cursor-pointer text-lg font-bold">Registrar pagamento sem comprovante (renovação, dinheiro...)</summary>
        <FormConfirmar memberId={membro.id} paymentId="" planoInicial={membro.plano} primeiraVez={!membro.data_inicio} inicioSugerido={inicioSugerido} hoje={hoje} />
      </details>

      <section className="card p-5">
        <h2 className="mb-4 text-xl font-bold">Histórico de pagamentos</h2>
        {pagamentos.length === 0 ? (
          <p className="text-suave">Nenhum pagamento ainda.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {pagamentos.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {plano(x.plano)?.curto} · {x.valor !== null ? reais(x.valor) : 'valor —'} · {x.forma ?? '—'}
                  </p>
                  <p className="text-suave">
                    {x.status === 'confirmado'
                      ? `Pago em ${dataBR(x.pago_em)} · período ${dataBR(x.periodo_inicio)} a ${dataBR(x.periodo_fim)}`
                      : `Enviado em ${dataHoraBR(x.created_at)}`}
                    {x.observacao && ` · ${x.observacao}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {links[x.id] && <a href={links[x.id]} target="_blank" rel="noreferrer" className="text-latao underline">comprovante</a>}
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${x.status === 'confirmado' ? 'border-ok/60 text-ok' : x.status === 'recusado' ? 'border-perigo/60 text-perigo' : 'border-latao/60 text-latao'}`}>
                    {x.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FormMembro membro={membro} />

      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Termo de adesão</h2>
        {termos?.length ? (
          <ul className="space-y-1 text-sm">
            {termos.map((t) => (
              <li key={t.id}>
                Versão <strong>{t.versao}</strong> aceita em {dataHoraBR(t.aceito_em)}
                {t.ip && <span className="text-suave"> · IP {t.ip}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-suave">Nenhum aceite registrado.</p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-xl font-bold">Diagnóstico</h2>
        <p className="mb-4 text-sm text-suave">
          Entrada: {entrada ? 'respondido' : 'ainda não'} · 90 dias: {noventa ? 'respondido' : 'ainda não'}
        </p>
        {noventa && entrada && <Comparacao entrada={entrada} noventa={noventa} />}
        {entrada && (
          <details open={!noventa}>
            <summary className="cursor-pointer font-semibold text-latao">Respostas da entrada</summary>
            <div className="mt-4 space-y-5">
              {ETAPAS_ENTRADA.map((e) => (
                <div key={e.titulo}>
                  <h3 className="mb-2 font-bold">{e.titulo}</h3>
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {e.perguntas.map((q) => (
                      <div key={q.id}>
                        <dt className="text-suave">{q.rotulo}</dt>
                        <dd className="whitespace-pre-line">{respostaLegivel(q, entrada[q.id])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  )
}

function Comparacao({ entrada, noventa }: { entrada: Respostas; noventa: Respostas }) {
  const perguntas = ETAPAS_90DIAS.flatMap((e) => e.perguntas)
  return (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="text-suave">
            <th className="py-2 pr-3 font-semibold">Pergunta</th>
            <th className="py-2 pr-3 font-semibold">Entrada</th>
            <th className="py-2 font-semibold">90 dias</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linha">
          {perguntas.map((q) => {
            const a = q.id === 'o_que_mudou' ? '' : respostaLegivel(q, entrada[q.id])
            const b = respostaLegivel(q, noventa[q.id])
            const mudou = q.id !== 'o_que_mudou' && a !== b
            return (
              <tr key={q.id}>
                <td className="py-2 pr-3 text-suave">{q.rotulo}</td>
                <td className="py-2 pr-3">{a || '—'}</td>
                <td className={`whitespace-pre-line py-2 ${mudou ? 'font-bold text-latao' : ''}`}>{b}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Box({ r, v }: { r: string; v: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-suave">{r}</p>
      <p className="text-lg font-bold">{v}</p>
    </div>
  )
}
