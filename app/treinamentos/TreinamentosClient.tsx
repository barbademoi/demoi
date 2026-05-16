'use client'

import Link from 'next/link'

const PREVISAO_LANCAMENTO = '30/05/2026'
const EMAIL_SUPORTE = 'suporte@barbermeta.com.br'
const WHATSAPP_SUPORTE = '5535998248211'
const WHATSAPP_DISPLAY = '(35) 99824-8211'
const WHATSAPP_MENSAGEM = 'Olá! Tenho uma dúvida sobre o BarberMeta.'

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
          <p className="text-sm text-text font-sans leading-relaxed mb-4">
            ⚠️ Enquanto isso, qualquer dúvida me chama:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={`https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(WHATSAPP_MENSAGEM)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1FB855] text-white font-sans font-semibold text-sm rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
              </svg>
              WhatsApp · {WHATSAPP_DISPLAY}
            </a>

            <a
              href={`mailto:${EMAIL_SUPORTE}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 hover:bg-border border border-border text-text font-sans font-semibold text-sm rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              E-mail
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted font-sans">
          📅 Previsão de lançamento: até {PREVISAO_LANCAMENTO}
        </p>
      </div>
    </main>
  )
}
