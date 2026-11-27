import { revalidatePath } from 'next/cache'
import { assertAdmin, requireAdmin } from '@/lib/auth'

const PILARES = ['Dono', 'Ambiente e atendimento', 'Equipe', 'Números e retenção', 'Crescimento']

export default async function Ciclo() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('mdc_ciclo').select('*').order('semana')

  async function salvar(fd: FormData) {
    'use server'
    const { supabase } = await assertAdmin()
    const linhas = Array.from({ length: 13 }, (_, i) => i + 1).map((s) => ({
      semana: s,
      tema: String(fd.get(`tema_${s}`) ?? '').trim().slice(0, 200) || `Tema da semana ${s}`,
      pilar: PILARES.includes(String(fd.get(`pilar_${s}`))) ? String(fd.get(`pilar_${s}`)) : 'Dono',
    }))
    await supabase.from('mdc_ciclo').upsert(linhas, { onConflict: 'semana' })
    revalidatePath('/admin/conteudo/ciclo')
    revalidatePath('/app', 'layout')
  }

  return (
    <form action={salvar} className="card space-y-4 p-5">
      <p className="text-suave">Tema e pilar de cada semana do ciclo. Aparece no início (“Semana X · Pilar”) e na biblioteca.</p>
      {Array.from({ length: 13 }, (_, i) => i + 1).map((s) => {
        const l = data?.find((x) => x.semana === s)
        return (
          <div key={s} className="grid gap-2 sm:grid-cols-[90px_1fr_220px] sm:items-center">
            <span className="font-bold">Semana {s}</span>
            <input name={`tema_${s}`} defaultValue={l?.tema ?? ''} className="campo py-2.5" placeholder="Tema" />
            <select name={`pilar_${s}`} defaultValue={l?.pilar ?? 'Dono'} className="campo py-2.5">
              {PILARES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        )
      })}
      <button className="btn-sm bg-latao px-5 text-fundo">Salvar ciclo</button>
    </form>
  )
}
