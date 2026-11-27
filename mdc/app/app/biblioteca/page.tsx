import { requireMembro } from '@/lib/membro'
import { assinar, youtubeId, type Ciclo } from '@/lib/conteudo'
import { dataBR } from '@/lib/format'

type Encontro = { id: string; nivel: number; semana: number; data: string; tema: string; pdf_path: string | null; youtube_url: string | null }
type Kit = { id: string; nivel: number; semana: number; titulo: string; descricao: string | null; file_path: string; ordem: number }

/**
 * Biblioteca por semana. O que vem do banco já passou pelo RLS (cadeado no
 * servidor): semana bloqueada simplesmente não retorna linha, então não há
 * link assinado para ela. A tela só desenha o cadeado.
 */
export default async function Biblioteca({ searchParams }: { searchParams: { nivel?: string } }) {
  const { supabase, semana } = await requireMembro()
  const nivelMax = Math.max(1, Math.floor((Math.max(semana, 1) - 1) / 13) + 1)
  const nivel = Math.min(Math.max(Number(searchParams.nivel) || nivelMax, 1), nivelMax)

  const [{ data: ciclo }, { data: es }, { data: ks }] = await Promise.all([
    supabase.from('ciclo').select('*').order('semana'),
    supabase.from('meetings').select('*').eq('nivel', nivel).order('data', { ascending: false }),
    supabase.from('kit_materials').select('*').eq('nivel', nivel).order('ordem'),
  ])
  const encontros = (es as Encontro[]) ?? []
  const kits = (ks as Kit[]) ?? []
  const urls = await assinar([...encontros.map((e) => e.pdf_path), ...kits.map((k) => k.file_path)])
  const temas = Object.fromEntries(((ciclo as Ciclo[]) ?? []).map((c) => [c.semana, c]))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Biblioteca</h1>
        <p className="text-suave">Cada semana abre na sua semana correspondente.</p>
      </div>

      {nivelMax > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: nivelMax }, (_, i) => i + 1).map((n) => (
            <a key={n} href={`/app/biblioteca?nivel=${n}`} className={`btn-sm border ${n === nivel ? 'border-latao bg-latao text-fundo' : 'border-linha text-suave'}`}>
              Nível {n}
            </a>
          ))}
        </div>
      )}

      <ol className="space-y-3">
        {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => {
          const semanaAbre = (nivel - 1) * 13 + n
          const aberta = semana >= semanaAbre
          const tema = temas[n]
          // mais recente daquela semana (o ciclo se repete a cada 13 semanas)
          const enc = encontros.find((e) => e.semana === n)
          const materiais = kits.filter((k) => k.semana === n)
          const yt = youtubeId(enc?.youtube_url)

          if (!aberta) {
            return (
              <li key={n} className="card flex items-center gap-4 p-4 opacity-60">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card-2 text-xl" aria-hidden>🔒</span>
                <div>
                  <p className="font-bold">Semana {n}</p>
                  <p className="text-sm text-suave">Abre na sua semana {semanaAbre}</p>
                </div>
              </li>
            )
          }
          return (
            <li key={n}>
              <details className="card group p-4" open={semanaAbre === semana}>
                <summary className="flex cursor-pointer list-none items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-latao/15 text-lg font-black text-latao">{n}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{enc?.tema ?? tema?.tema ?? `Semana ${n}`}</p>
                    <p className="text-sm text-suave">{tema?.pilar}{enc ? ` · ${dataBR(enc.data)}` : ''}</p>
                  </div>
                  <span className="text-xl text-suave transition group-open:rotate-90" aria-hidden>›</span>
                </summary>
                <div className="mt-4 space-y-3">
                  {yt && (
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={enc!.tema} className="h-full w-full" loading="lazy" allowFullScreen />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {enc?.pdf_path && urls[enc.pdf_path] && (
                      <a href={urls[enc.pdf_path]} target="_blank" rel="noreferrer" className="btn-secundario w-full justify-start sm:w-full">📄 Resumo do encontro</a>
                    )}
                    {materiais.map((k) =>
                      urls[k.file_path] ? (
                        <a key={k.id} href={urls[k.file_path]} target="_blank" rel="noreferrer" className="btn-secundario w-full justify-start text-left sm:w-full">
                          🧰 {k.titulo}
                        </a>
                      ) : null,
                    )}
                  </div>
                  {!enc && materiais.length === 0 && <p className="text-sm text-suave">O material desta semana ainda vai ser publicado.</p>}
                </div>
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
