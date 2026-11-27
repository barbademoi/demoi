import Link from 'next/link'
import { requireMembro } from '@/lib/membro'
import { assinar } from '@/lib/conteudo'
import { dataBR, hojeSP, somarDias } from '@/lib/format'
import { habitosDaSemana, inicioDaSemana, missoesDaSemana, resumoSemana, type Modelo, type Registro } from '@/lib/missoes'
import Checklist from './Checklist'

export default async function Missoes() {
  const { supabase, user, membro, semana } = await requireMembro()
  if (semana < 1) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-2xl font-black">Suas missões começam em {dataBR(membro.data_inicio)}</h1>
        <p className="mt-2 text-suave">Até lá, entra no grupo e se prepara pro primeiro encontro.</p>
      </div>
    )
  }

  const hoje = hojeSP()
  const [{ data: ms }, { data: rs }, { data: kits }] = await Promise.all([
    supabase.from('mdc_mission_templates').select('*').eq('ativo', true),
    supabase.from('mdc_mission_logs').select('id, template_id, dia, semana, observacao').eq('member_id', user.id),
    supabase.from('mdc_kit_materials').select('id, titulo, file_path'),
  ])
  const modelos = (ms as Modelo[]) ?? []
  const registros = (rs as Registro[]) ?? []
  const urls = await assinar((kits ?? []).map((k) => k.file_path))
  const kitPorId = Object.fromEntries((kits ?? []).map((k) => [k.id, { titulo: k.titulo as string, url: urls[k.file_path] ?? '' }]))

  const habitos = habitosDaSemana(modelos, semana)
  const missoes = missoesDaSemana(modelos, semana)
  const iniSemana = inicioDaSemana(membro.data_inicio!, semana)

  const itensHabitos = habitos.map((h) => ({
    id: h.id,
    titulo: h.titulo,
    descricao: h.descricao,
    feito: registros.some((r) => r.template_id === h.id && r.dia === hoje),
    kit: h.kit_material_id ? kitPorId[h.kit_material_id] ?? null : null,
    observacao: null,
  }))
  const itensMissoes = missoes.map((m) => {
    const r = registros.find((x) => x.template_id === m.id && x.dia === null && x.semana === semana)
    return {
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao,
      feito: !!r,
      kit: m.kit_material_id ? kitPorId[m.kit_material_id] ?? null : null,
      observacao: r?.observacao ?? '',
    }
  })

  const historico = Array.from({ length: semana - 1 }, (_, i) => semana - 1 - i).map((w) => ({
    semana: w,
    inicio: inicioDaSemana(membro.data_inicio!, w),
    ...resumoSemana(modelos, registros, membro.data_inicio!, w),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Missões</h1>
        <p className="text-suave">
          Semana {semana} · {dataBR(iniSemana)} a {dataBR(somarDias(iniSemana, 6))}
        </p>
      </div>

      <Checklist titulo="Hábitos de hoje" tipo="habito_diario" itens={itensHabitos} vazio="Nenhum hábito por enquanto. Eles chegam com as semanas." />
      <Checklist titulo="Missões da semana" tipo="missao_semana" itens={itensMissoes} vazio="Sem missão de implantação nesta semana." />

      {historico.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Semanas anteriores</h2>
          <ul className="space-y-2">
            {historico.map((h) => (
              <li key={h.semana}>
                <details className="card p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span>
                      <strong>Semana {h.semana}</strong>
                      <span className="ml-2 text-sm text-suave">{dataBR(h.inicio)}</span>
                    </span>
                    <span className={`text-lg font-black ${h.pct >= 80 ? 'text-ok' : h.pct >= 40 ? 'text-latao' : 'text-alerta'}`}>{h.pct}%</span>
                  </summary>
                  <div className="mt-3 text-sm">
                    <p className="text-suave">{h.feitos} de {h.previstos} itens marcados</p>
                    {h.missoes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {h.missoes.map((m) => {
                          const feita = h.missoesFeitas.some((x) => x.id === m.id)
                          const obs = registros.find((r) => r.template_id === m.id && r.dia === null && r.semana === h.semana)?.observacao
                          return (
                            <li key={m.id}>
                              <span className={feita ? 'text-ok' : 'text-suave'}>{feita ? '✓' : '○'}</span> {m.titulo}
                              {obs && <span className="block pl-5 text-suave">“{obs}”</span>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/app/ranking" className="btn-secundario w-full sm:w-full">Ver ranking do mês</Link>
    </div>
  )
}
