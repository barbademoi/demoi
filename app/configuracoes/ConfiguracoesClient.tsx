'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Barbeiro } from '@/types/database'
import IdentidadeTab from './IdentidadeTab'
import OperacaoTab from './OperacaoTab'
import EquipeTab from './EquipeTab'
import ContaTab from './ContaTab'

type TabId = 'identidade' | 'operacao' | 'equipe' | 'conta'

export interface BarbeariaConfig {
  nome: string
  cidade: string | null
  logo_url: string | null
  cor_principal: string | null
  dias_trabalhados: { dia: string; ativo: boolean }[] | null
  horario_abertura: string | null
  horario_fechamento: string | null
  modalidade: string | null
  tem_assinatura: boolean | null
  visibilidade_ranking: 'completo' | 'posicoes' | 'proprio' | null
  dia_fechamento: number | null
  mostrar_ticket_medio: boolean | null
}

interface Props {
  barbearia: BarbeariaConfig
  barbeiros: Barbeiro[]
  email: string
}

export default function ConfiguracoesClient({ barbearia, barbeiros, email }: Props) {
  const [tab, setTab] = useState<TabId>('identidade')
  const isAutonomo = barbearia.modalidade === 'sozinho'

  const TABS: { id: TabId; label: string }[] = [
    { id: 'identidade', label: 'Identidade' },
    { id: 'operacao',   label: 'Operação' },
    { id: 'equipe',     label: isAutonomo ? 'Perfil' : 'Equipe' },
    { id: 'conta',      label: 'Conta' },
  ]

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-text">Configurações</h1>
            <p className="text-text-muted text-sm font-sans mt-0.5">{barbearia.nome}</p>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={[
                'flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all',
                tab === t.id
                  ? 'bg-surface text-text shadow-sm border border-border'
                  : 'text-text-muted hover:text-text',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card p-6">
          {tab === 'identidade' && <IdentidadeTab barbearia={barbearia} />}
          {tab === 'operacao'   && <OperacaoTab barbearia={barbearia} />}
          {tab === 'equipe'     && <EquipeTab barbeiros={barbeiros} isAutonomo={isAutonomo} />}
          {tab === 'conta'      && <ContaTab email={email} />}
        </div>
      </div>
    </main>
  )
}
