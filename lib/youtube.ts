/**
 * Extrai o ID de 11 chars de um vídeo do YouTube a partir de qualquer formato comum:
 * - "AFeQkBFBbwc"                                  (ID puro)
 * - "https://youtu.be/AFeQkBFBbwc"                 (URL curta)
 * - "https://youtu.be/AFeQkBFBbwc?si=abc123"       (URL curta com tracking)
 * - "https://www.youtube.com/watch?v=AFeQkBFBbwc"  (URL completa)
 * - "https://www.youtube.com/embed/AFeQkBFBbwc"    (URL de embed)
 * - "https://www.youtube.com/shorts/AFeQkBFBbwc"   (URL de shorts)
 *
 * Retorna o input original (trimmed) se não conseguir extrair — fallback seguro.
 */
export function extractYouTubeId(input: string | null | undefined): string {
  if (!input) return ''
  const s = input.trim()
  if (!s) return ''

  // Já parece ID puro (11 chars alfanuméricos + - e _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s

  // Tenta cada padrão de URL conhecido
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const match = s.match(re)
    if (match) return match[1]
  }

  // Não reconheceu — devolve o input pra não perder o dado (mas vai falhar visualmente)
  return s
}
