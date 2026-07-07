import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPORTE, whatsappUrl } from '@/lib/suporte'
import { extractYouTubeId } from '@/lib/youtube'

export const metadata = {
  title: 'Treinamentos — BarberMeta',
}

type Treinamento = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  youtube_id: string
  duracao: string | null
}

export default async function TreinamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('treinamentos')
    .select('id, ordem, titulo, descricao, youtube_id, duracao')
    .order('ordem')

  const treinamentos: Treinamento[] = (rows ?? []).filter(
    (r: Treinamento) => r.youtube_id && !r.youtube_id.startsWith('PLACEHOLDER'),
  )

  return (
    <main className="bm-theme min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-text">Treinamentos</h1>
            <p className="text-text-muted text-sm font-sans mt-0.5">
              Aprenda a usar o BarberMeta no seu dia a dia
            </p>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">← Dashboard</Link>
        </div>

        {/* Aviso mobile */}
        <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/30 text-sm font-sans flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden>
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <p className="flex-1 text-text leading-relaxed">
            <span className="font-semibold">📱 Boa notícia:</span> todas as configurações
            que você vê nas aulas podem ser feitas direto pelo celular. O BarberMeta
            é 100% responsivo — basta abrir <span className="font-semibold">barbermeta.com.br</span> no
            navegador do seu smartphone.
          </p>
        </div>

        {treinamentos.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-text-muted text-sm font-sans">
              Nenhum treinamento disponível ainda. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {treinamentos.map((t) => {
              const videoId = extractYouTubeId(t.youtube_id)
              return (
              <a
                key={t.id}
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full card p-0 overflow-hidden hover:border-primary/40 transition-colors text-left group"
              >
                <div className="flex items-stretch gap-0">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-32 sm:w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={t.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black ml-0.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-center gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-sans font-semibold tabular-nums">
                        {String(t.ordem).padStart(2, '0')}
                      </span>
                      {t.duracao && (
                        <span className="text-xs bg-surface-2 border border-border text-text-muted font-sans px-2 py-0.5 rounded-full">
                          {t.duracao}
                        </span>
                      )}
                    </div>
                    <p className="font-sans font-semibold text-text text-sm leading-snug">
                      {t.titulo}
                    </p>
                    {t.descricao && (
                      <p className="text-xs text-text-muted font-sans leading-relaxed line-clamp-2">
                        {t.descricao}
                      </p>
                    )}
                    <p className="text-[11px] text-text-muted font-sans flex items-center gap-1 mt-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Abre no YouTube
                    </p>
                  </div>
                </div>
              </a>
              )
            })}
          </div>
        )}

        {/* Bloco de suporte */}
        <div className="card p-5 mb-4 border-[#D4A85A]/30 bg-[#D4A85A]/5">
          <p className="text-sm text-text font-sans leading-relaxed mb-4">
            ⚠️ Qualquer dúvida me chama:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1FB855] text-white font-sans font-semibold text-sm rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
              </svg>
              WhatsApp · {SUPORTE.whatsappDisplay}
            </a>

            <a
              href={`mailto:${SUPORTE.email}`}
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
      </div>
    </main>
  )
}
