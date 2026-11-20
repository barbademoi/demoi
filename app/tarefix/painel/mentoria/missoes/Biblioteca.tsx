'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Missao } from '@/lib/tarefix/mentoria'
import { Erro, Vazio, useAcao, useAviso } from '@/components/tarefix/ui'
import { duplicarMissao, excluirMissao, pausarMissao } from '../acoes'
import { EditorMissao } from '../EditorMissao'
import { regraMissao } from '../[id]/DetalheMentorado'

type MissaoPara = Missao & { para: string[] }
type Filtro = 'todas' | 'ativas' | 'sem' | 'pausadas'

const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function Biblioteca({ missoes, mentorados, hoje }: { missoes: MissaoPara[]; mentorados: { id: string; nome: string; ativo: boolean }[]; hoje: string }) {
  const router = useRouter()
  const acao = useAcao()
  const aviso = useAviso()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [editando, setEditando] = useState<MissaoPara | 'nova' | null>(null)
  const nome = Object.fromEntries(mentorados.map((m) => [m.id, m.nome.split(' ')[0]]))
  const ativos = mentorados.filter((m) => m.ativo).map((m) => ({ id: m.id, nome: m.nome }))

  const lista = useMemo(() => {
    const q = norm(busca.trim())
    const ordenadas = [...missoes].sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)))
    return ordenadas.filter((m) => {
      if (filtro === 'ativas' && (!m.ativo || m.para.length === 0)) return false
      if (filtro === 'sem' && m.para.length > 0) return false
      if (filtro === 'pausadas' && m.ativo) return false
      return !q || norm(`${m.titulo} ${m.descricao ?? ''}`).includes(q)
    })
  }, [missoes, busca, filtro])

  const pronto = (t: string) => () => {
    aviso.mostrar(t)
    router.refresh()
  }
  const contagem: Record<Filtro, number> = {
    todas: missoes.length,
    ativas: missoes.filter((m) => m.ativo && m.para.length > 0).length,
    sem: missoes.filter((m) => m.para.length === 0).length,
    pausadas: missoes.filter((m) => !m.ativo).length,
  }

  return (
    <div className="space-y-4">
      <button type="button" className="tf-botao w-full sm:w-auto sm:px-6" onClick={() => setEditando('nova')}>
        + Nova missão
      </button>
      <input className="tf-campo" placeholder="Buscar missão…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar missão" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar">
        {(
          [
            ['todas', 'Todas'],
            ['ativas', 'Em uso'],
            ['sem', 'Sem mentorado'],
            ['pausadas', 'Pausadas'],
          ] as const
        ).map(([v, t]) => (
          <button
            key={v}
            type="button"
            aria-pressed={filtro === v}
            onClick={() => setFiltro(v)}
            className={`min-h-[36px] shrink-0 rounded-full border px-4 text-sm font-bold ${filtro === v ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
          >
            {t} ({contagem[v]})
          </button>
        ))}
      </div>
      <Erro texto={acao.erro} />

      {missoes.length === 0 ? (
        <Vazio titulo="Nenhuma missão ainda" texto="Crie a primeira: ela fica guardada aqui para usar com qualquer mentorado." />
      ) : lista.length === 0 ? (
        <p className="py-8 text-center text-tf-suave">Nada encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((m) => (
            <li key={m.id} className={`tf-cartao p-4 ${m.ativo ? '' : 'opacity-60'}`}>
              <button type="button" className="block w-full text-left" onClick={() => setEditando(m)}>
                <p className="text-lg font-extrabold leading-snug">
                  {m.destaque && <span className="mr-2 inline-flex items-center rounded-full bg-[#D4A017] px-2 py-0.5 align-middle text-[11px] font-extrabold text-[#1a1408]">⭐ PRIORIDADE</span>}
                  {m.titulo}
                </p>
                <p className="text-sm text-tf-suave">
                  {regraMissao(m)}
                  {m.prova !== 'nenhuma' && ` · prova: ${m.prova === 'foto' ? 'foto' : 'texto'}`}
                  {m.aprovacao && ' · com aprovação'}
                  {(m.checklist?.length ?? 0) > 0 && ` · checklist de ${m.checklist!.length}`}
                  {!m.ativo && ' · pausada'}
                </p>
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.para.length === 0 ? (
                  <span className="rounded-full bg-tf-borda px-2 py-0.5 text-xs font-bold">sem mentorado</span>
                ) : (
                  m.para.map((id) => (
                    <span key={id} className="rounded-full bg-tf-marca-clara px-2 py-0.5 text-xs font-bold text-tf-marca-texto">
                      {nome[id] ?? '—'}
                    </span>
                  ))
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                <button type="button" className="text-tf-marca-texto" onClick={() => setEditando(m)}>
                  Editar / vincular
                </button>
                <button type="button" className="text-tf-marca-texto" disabled={acao.pendente} onClick={() => acao.rodar(() => duplicarMissao(m.id), pronto('Missão duplicada'))}>
                  Duplicar
                </button>
                <button type="button" className="text-tf-suave" disabled={acao.pendente} onClick={() => acao.rodar(() => pausarMissao(m.id, !m.ativo), pronto(m.ativo ? 'Missão pausada' : 'Missão reativada'))}>
                  {m.ativo ? 'Pausar' : 'Reativar'}
                </button>
                <button
                  type="button"
                  className="text-tf-suave"
                  disabled={acao.pendente}
                  onClick={() =>
                    confirm(`Excluir “${m.titulo}”${m.para.length ? ` de ${m.para.length} mentorado${m.para.length > 1 ? 's' : ''}` : ''}? As entregas dela também somem.`) &&
                    acao.rodar(() => excluirMissao(m.id), pronto('Missão excluída'))
                  }
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <EditorMissao
          aberto
          hoje={hoje}
          mentorados={ativos}
          missao={editando === 'nova' ? null : editando}
          paraPadrao={[]}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null)
            pronto('Missão salva')()
          }}
        />
      )}
      {aviso.elemento}
    </div>
  )
}
