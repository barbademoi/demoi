'use client'

import { useEffect, useState } from 'react'

// Bump quando lançar um pacote novo de atualizações; quem já fechou as
// versões anteriores volta a ver o aviso da nova.
const NOVIDADES_VERSAO = '2026-05'
const STORAGE_KEY = `novidades_dismissed_${NOVIDADES_VERSAO}`

interface Novidade {
  emoji: string
  titulo: string
  descricao: string
}

const NOVIDADES_ATUAIS: Novidade[] = [
  {
    emoji: '🤖',
    titulo: 'Resumo da reunião com IA',
    descricao: 'Em Configurações → Resumo para reunião, a IA monta o texto pronto com metas, campanha e regras — copia ou manda direto no WhatsApp.',
  },
  {
    emoji: '📋',
    titulo: 'Regras gerais + combinados da barbearia',
    descricao: 'Aba nova no Configurar campanha. As regras fixas vêm prontas; os combinados da sua barbearia você adiciona — aparecem pro barbeiro na aba "Regras" do link dele.',
  },
  {
    emoji: '🥇',
    titulo: 'Meta coletiva com Bronze, Prata e Ouro',
    descricao: 'A meta da equipe agora tem 3 tiers, igual as individuais. O dashboard mostra qual tier vocês atingiram e quanto falta pro próximo.',
  },
  {
    emoji: '📅',
    titulo: 'Configurar metas de meses futuros',
    descricao: 'No MetasModal dá pra navegar pra qualquer mês com ◀ ▶ e, se o anterior tem metas, um botão "Copiar metas" preenche tudo num clique.',
  },
  {
    emoji: '👥',
    titulo: 'Recepcionistas só nas pontuações',
    descricao: 'Recepcionista não aparece mais na config de metas de comissão. Na tela individual dele só aparece a parte de pontos.',
  },
]

export default function NovidadesBanner() {
  // Começa escondido pra não dar flicker. useEffect decide se mostra.
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setMostrar(true)
    } catch { /* ignore (modo privado etc.) */ }
  }, [])

  function fechar() {
    setMostrar(false)
    try { window.localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
  }

  if (!mostrar) return null

  return (
    <div className="card p-5 sm:p-6 relative">
      <button
        onClick={fechar}
        aria-label="Fechar"
        className="absolute top-3 right-3 text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-sans font-bold uppercase tracking-wider text-primary">
          🚀 Novidades
        </span>
        <span className="text-text-muted text-xs font-sans">Maio 2026</span>
      </div>
      <h2 className="font-serif text-lg sm:text-xl text-text leading-tight mb-4 pr-8">
        O sistema cresceu — olha o que entrou
      </h2>

      <ul className="space-y-3">
        {NOVIDADES_ATUAIS.map((n, i) => (
          <li key={i} className="flex items-start gap-3">
            <span aria-hidden className="text-xl shrink-0 mt-0.5">{n.emoji}</span>
            <div className="min-w-0">
              <p className="font-sans font-semibold text-text text-sm leading-snug">{n.titulo}</p>
              <p className="text-text-muted text-xs font-sans leading-relaxed mt-0.5">{n.descricao}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-text-muted text-[11px] font-sans mt-4 pt-4 border-t border-border">
        Continua sendo gratuito pra quem comprou — atualizações sempre incluídas.
      </p>
    </div>
  )
}
