import { exigirDono } from '@/lib/tarefix/dono'
import { detalhePlacar } from '@/lib/tarefix/placarTexto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { dataPorExtenso, hojeSP, somarDias } from '@/lib/tarefix/datas'
import { gerarTarefasDoDia, lerDia, placar } from '@/lib/tarefix/tarefasDia'
import { Titulo, Vazio } from '@/components/tarefix/ui'
import { Termometro } from '@/components/tarefix/Termometro'
import { DiaHistorico } from './DiaHistorico'

export const metadata = { title: 'Histórico' }

export default async function Historico({ searchParams }: { searchParams: { c?: string; d?: string } }) {
  const { db, empresa } = await exigirDono()
  const hoje = hojeSP()
  const { data: colabs } = await db.from('colaboradores').select('id, empresa_id, nome, ativo, criado_em').order('ativo', { ascending: false }).order('nome')
  const lista = colabs ?? []
  if (lista.length === 0) return (<><Titulo>Histórico</Titulo><Vazio titulo="Ninguém cadastrado ainda" /></>)

  const colab = lista.find((c) => c.id === searchParams.c) ?? lista[0]
  const data = searchParams.d && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d) && searchParams.d <= hoje ? searchParams.d : somarDias(hoje, -1)

  // Dia nunca aberto: gera agora (regras de dia fechado). Só para quem está ativo.
  const admin = createTarefixAdmin()
  if (colab.ativo) await gerarTarefasDoDia(colab, empresa, data, admin)
  const [tarefas, { data: folga }, { data: extras }, { data: fechado }] = await Promise.all([
    lerDia(colab.id, data, admin),
    db.from('folgas').select('id').eq('colaborador_id', colab.id).eq('data', data).maybeSingle(),
    db.from('extras').select('id, descricao, status, foto_path').eq('colaborador_id', colab.id).eq('data', data).order('criado_em'),
    db.from('meses_fechados').select('id').eq('ano_mes', data.slice(0, 7)).limit(1).maybeSingle(),
  ])
  const caminhos = [...tarefas.map((t) => t.foto_path), ...(extras ?? []).map((x) => x.foto_path)].filter((p): p is string => Boolean(p))
  const urls: Record<string, string> = {}
  if (caminhos.length) {
    const { data: assinadas } = await admin.storage.from('tarefix-provas').createSignedUrls(caminhos, 3600)
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
  }
  const p = placar(tarefas)

  return (
    <>
      <Titulo>Histórico</Titulo>
      <form className="tf-cartao mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]" method="get">
        <select name="c" defaultValue={colab.id} className="tf-campo" aria-label="Colaborador">
          {lista.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.ativo ? '' : ' (desativado)'}
            </option>
          ))}
        </select>
        <input type="date" name="d" defaultValue={data} max={hoje} className="tf-campo" aria-label="Data" />
        <button type="submit" className="tf-botao">Ver</button>
      </form>

      <h2 className="mb-3 text-lg font-extrabold first-letter:uppercase">
        {colab.nome.split(' ')[0]} · {dataPorExtenso(data)}
      </h2>

      {folga ? (
        <Vazio titulo="Folga" texto="Dia de folga: sem tarefas e fora do cálculo do mês." />
      ) : tarefas.length === 0 ? (
        <Vazio titulo="Sem tarefas neste dia" />
      ) : (
        <>
          <section className="tf-cartao mb-5 p-5">
            <Termometro rotulo={data === hoje ? 'Até agora' : 'Resultado do dia'} percentual={p?.percentual ?? null} detalhe={detalhePlacar(p, '')} />
          </section>
          <DiaHistorico
            data={data}
            horarioFechamento={empresa.horario_fechamento}
            mesFechado={Boolean(fechado)}
            tarefas={tarefas.map((t) => ({
              id: t.id,
              titulo: t.titulo,
              descricao: t.descricao,
              exige_foto: t.exige_foto,
              status: t.status,
              feita_em: t.feita_em,
              motivo_reprovacao: t.motivo_reprovacao,
              foto_url: t.foto_path ? urls[t.foto_path] ?? null : null,
              horario_inicio: t.horario_inicio ? t.horario_inicio.slice(0, 5) : null,
      horario_limite: t.horario_limite ? t.horario_limite.slice(0, 5) : null,
              tempo_estimado_min: t.tempo_estimado_min ?? null,
      continua: t.continua ?? false,
      peso: t.peso ?? 1,
      autoavaliacao: t.autoavaliacao ?? null,
      observacao: t.observacao ?? null,
            }))}
            extras={(extras ?? []).map((x) => ({ id: x.id, descricao: x.descricao, status: x.status, foto_url: x.foto_path ? urls[x.foto_path] ?? null : null }))}
          />
        </>
      )}
    </>
  )
}
