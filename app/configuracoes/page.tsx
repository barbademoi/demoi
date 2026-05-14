import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Barbeiro } from '@/types/database'
import IdentidadeTab from './IdentidadeTab'
import OperacaoTab from './OperacaoTab'
import EquipeTab from './EquipeTab'
import ContaTab from './ContaTab'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select(`
      barbearia_id,
      barbearias (
        nome, cidade, logo_url, cor_principal,
        dias_trabalhados, horario_abertura, horario_fechamento,
        modalidade, tem_assinatura
      )
    `)
    .eq('id', user.id)
    .single()

  if (!usuarioRaw?.barbearia_id) redirect('/login')

  const barbearia = usuarioRaw.barbearias as {
    nome: string; cidade: string | null; logo_url: string | null; cor_principal: string | null
    dias_trabalhados: { dia: string; ativo: boolean }[] | null
    horario_abertura: string | null; horario_fechamento: string | null
    modalidade: string | null; tem_assinatura: boolean | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', usuarioRaw.barbearia_id)
    .order('nome')

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]

  return <ConfiguracoesClient
    barbearia={barbearia}
    barbeiros={barbeiros}
    email={user.email ?? ''}
  />
}

// ── Client Shell ────────────────────────────────────────────────────────────

'use client'

import { useState } from 'react'
import Link from 'next/link'

const TABS = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'operacao',   label: 'Operação' },
  { id: 'equipe',     label: 'Equipe' },
  { id: 'conta',      label: 'Conta' },
] as const

type TabId = typeof TABS[number]['id']

interface ClientProps {
  barbearia: {
    nome: string; cidade: string | null; logo_url: string | null; cor_principal: string | null
    dias_trabalhados: { dia: string; ativo: boolean }[] | null
    horario_abertura: string | null; horario_fechamento: string | null
    modalidade: string | null; tem_assinatura: boolean | null
  }
  barbeiros: Barbeiro[]
  email: string
}

function ConfiguracoesClient({ barbearia, barbeiros, email }: ClientProps) {
  const [tab, setTab] = useState<TabId>('identidade')

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-text">Configurações</h1>
            <p className="text-text-muted text-sm font-sans mt-0.5">{barbearia.nome}</p>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={['flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all',
                tab === t.id ? 'bg-surface text-text shadow-sm border border-border' : 'text-text-muted hover:text-text',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card p-6">
          {tab === 'identidade' && <IdentidadeTab barbearia={barbearia} />}
          {tab === 'operacao'   && <OperacaoTab barbearia={barbearia} />}
          {tab === 'equipe'     && <EquipeTab barbeiros={barbeiros} />}
          {tab === 'conta'      && <ContaTab email={email} />}
        </div>
      </div>
    </main>
  )
}
