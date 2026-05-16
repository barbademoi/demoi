'use client'

import Link from 'next/link'

const PREVISAO_LANCAMENTO = '30/05/2026'
const EMAIL_SUPORTE = 'suporte@barbermeta.com.br'

type AulaStatus = 'em-breve' | 'disponivel'

type Aula = {
  numero: number
  icone: string
  titulo: string
  descricao: string
  duracao: string
  status: AulaStatus
  youtubeId?: string
}

const AULAS: Aula[] = [
  {
    numero: 1,
    icone: '🎯',
    titulo: 'Configurações básicas',
    descricao: 'Como deixar o sistema do seu jeito',
    duracao: '~5 min',
    status: 'em-breve',
  },
  {
    numero: 2,
    icone: '💰',
    titulo: 'Metas individuais',
    descricao: 'Definir metas Bronze, Prata e Ouro',
    duracao: '~8 min',
    status: 'em-breve',
  },
  {
    numero: 3,
    icone: '🏆',
    titulo: 'Gamificação por pontos',
    descricao: 'O sistema alternativo às metas',
    duracao: '~6 min',
    status: 'em-breve',
  },
  {
    numero: 4,
    icone: '📊',
    titulo: 'Operação dia a dia',
    descricao: 'Como alimentar o sistema sem esforço',
    duracao: '~5 min',
    status: 'em-breve',
  },
]

function AulaCard({ aula }: { aula: Aula }) {
  if (aula.status === 'disponivel') {
    return (
      <button
        type="button"
        className="card p-5 text-left w-full hover:border-primary/40 transition-colors flex items-start gap-4"
        // onClick será definido quando os vídeos estiverem prontos
      >
        <span className="text-2xl shrink-0" aria-hidden>{aula.icone}</span>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-text text-sm">
            Aula {aula.numero} — {aula.titulo}
          </p>
          <p className="text-xs text-text-muted font-sans mt-0.5">
            {aula.descricao}
          </p>
          <p className="text-xs text-[#D4A85A] font-sans mt-1.5">
            ▶ Assistir · {aula.duracao}
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="card p-5 opacity-70 flex items-start gap-4 cursor-not-allowed">
      <span className="text-2xl shrink-0" aria-hidden>{aula.icone}</span>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-text text-sm">
          Aula {aula.numero} — {aula.titulo}
        </p>
        <p className="text-xs text-text-muted font-sans mt-0.5">
          {aula.descricao}
        </p>
        <p className="text-xs text-text-muted font-sans mt-1.5">
          ⏳ Em breve · {aula.duracao}
        </p>
      </div>
    </div>
  )
}

export default function TreinamentosClient() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-2xl text-text">Treinamentos</h1>
            <p className="text-text-muted text-sm font-sans mt-0.5">
              Aprenda a usar o BarberMeta no seu dia a dia
            </p>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#D4A85A]/10 border border-[#D4A85A]/30 mb-5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 text-[#D4A85A]"
              aria-hidden
            >
              <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
              <path d="m6.2 5.3 3.1 3.9" />
              <path d="m12.4 3.4 3.1 4" />
              <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
          </div>

          <h2 className="font-serif text-xl text-text tracking-wide">
            AULAS EM PRODUÇÃO
          </h2>
          <div className="w-20 h-px bg-[#D4A85A]/50 mx-auto mt-3 mb-5" />

          <p className="text-text-muted text-sm font-sans leading-relaxed max-w-md mx-auto">
            Estamos gravando as aulas de treinamento pra você dominar o
            BarberMeta em 30 minutos.
          </p>
        </div>

        <p className="text-xs font-sans font-semibold text-text-muted tracking-wider uppercase mb-3">
          Próximas aulas disponíveis
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {AULAS.map((aula) => (
            <AulaCard key={aula.numero} aula={aula} />
          ))}
        </div>

        <div className="card p-5 mb-4 border-[#D4A85A]/30 bg-[#D4A85A]/5">
          <p className="text-sm text-text font-sans leading-relaxed">
            ⚠️ Enquanto isso, qualquer dúvida me chama em{' '}
            <a
              href={`mailto:${EMAIL_SUPORTE}`}
              className="text-[#D4A85A] hover:underline"
            >
              {EMAIL_SUPORTE}
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted font-sans">
          📅 Previsão de lançamento: até {PREVISAO_LANCAMENTO}
        </p>
      </div>
    </main>
  )
}
