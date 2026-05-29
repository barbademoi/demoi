'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import StatusBadge from '@/components/StatusBadge'
import type { Profissional, StatusProfissional } from '@/lib/profissionais'

type Filtro = 'todos' | StatusProfissional

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'ativo', label: 'Ativos' },
  { valor: 'afastado', label: 'Afastados' },
  { valor: 'desligado', label: 'Desligados' },
]

export default function ListaClient({
  profissionais,
}: {
  profissionais: Profissional[]
}) {
  const [filtro, setFiltro] = useState<Filtro>('ativo')

  if (profissionais.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-linho flex items-center justify-center text-marrom text-3xl">
          ＋
        </div>
        <p className="text-text font-medium mb-1">Sua equipe começa aqui</p>
        <p className="text-chumbo text-sm mb-6">Cadastre o primeiro colaborador da sua equipe.</p>
        <Link href="/painel/profissionais/novo" className="btn-primary">
          + Cadastrar colaborador
        </Link>
      </div>
    )
  }

  const lista = profissionais.filter((p) => filtro === 'todos' || p.status === filtro)

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            className={[
              'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filtro === f.valor
                ? 'border-marrom bg-marrom text-white'
                : 'border-border bg-white text-grafite hover:border-marrom/40',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-chumbo text-sm text-center py-10">
          Nenhum colaborador nesse filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lista.map((p) => (
            <Link
              key={p.id}
              href={`/painel/profissionais/${p.id}`}
              className="card p-4 flex items-center gap-3 hover:border-marrom/40 transition-colors"
            >
              <Avatar nome={p.nome} fotoUrl={p.foto_url} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text truncate">{p.nome}</p>
                <p className="text-sm text-chumbo truncate">{p.funcao || 'Sem função'}</p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
