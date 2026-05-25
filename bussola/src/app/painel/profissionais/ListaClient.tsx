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

export default function ListaClient({ profissionais }: { profissionais: Profissional[] }) {
  const [filtro, setFiltro] = useState<Filtro>('ativo')

  // Empty state geral — ninguém cadastrado ainda.
  if (profissionais.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center text-primary text-3xl">
          ＋
        </div>
        <p className="text-text font-medium mb-1">Sua equipe começa aqui</p>
        <p className="text-text-muted text-sm mb-6">Cadastre o primeiro profissional da sua equipe.</p>
        <Link href="/painel/profissionais/novo" className="btn-primary">
          + Cadastrar profissional
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
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-white text-text-muted hover:border-primary/40',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-10">
          Nenhum profissional nesse filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lista.map((p) => (
            <Link
              key={p.id}
              href={`/painel/profissionais/${p.id}`}
              className="card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <Avatar nome={p.nome} fotoUrl={p.foto_url} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text truncate">{p.nome}</p>
                <p className="text-sm text-text-muted truncate">{p.funcao || 'Sem função'}</p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
