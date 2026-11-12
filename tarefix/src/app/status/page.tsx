import { Logo } from '@/components/Logo'
import { createAdminClient } from '@/lib/supabase/admin'
import { agoraSP, horarioCurto } from '@/lib/datas'

export const dynamic = 'force-dynamic'

type Checagem = { nome: string; ok: boolean; detalhe?: string }

// Página de diagnóstico da Etapa 1: confere env, conexão, tabelas, seed e bucket.
// Não mostra nenhum dado sensível — só ✓/✗ e contagens.
async function checar(): Promise<Checagem[]> {
  const out: Checagem[] = []
  const envs = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'TAREFIX_SESSION_SECRET']
  for (const e of envs) out.push({ nome: `Variável ${e}`, ok: Boolean(process.env[e]) })
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return out

  const db = createAdminClient()
  const tabelas = [
    'empresas', 'donos', 'funcoes', 'colaboradores', 'tarefas_modelo', 'tarefas_avulsas', 'folgas',
    'tarefas_dia', 'extras', 'bonus_config', 'avisos', 'meses_fechados',
  ]
  for (const t of tabelas) {
    const { count, error } = await db.from(t).select('*', { count: 'exact', head: true })
    out.push({ nome: `Tabela ${t}`, ok: !error, detalhe: error ? error.message : `${count ?? 0} linha(s)` })
  }

  const { data: empresa } = await db.from('empresas').select('nome, horario_fechamento').limit(1).maybeSingle()
  out.push({
    nome: 'Seed: empresa',
    ok: Boolean(empresa),
    detalhe: empresa ? `${empresa.nome} · fecha às ${horarioCurto(empresa.horario_fechamento)}` : 'rode supabase/seed.sql',
  })
  const { count: donos } = await db.from('donos').select('*', { count: 'exact', head: true })
  out.push({ nome: 'Seed: dono', ok: (donos ?? 0) > 0, detalhe: `${donos ?? 0} dono(s)` })

  const { data: buckets, error: eb } = await db.storage.listBuckets()
  const provas = buckets?.find((b) => b.id === 'provas')
  out.push({
    nome: 'Bucket "provas" (privado)',
    ok: Boolean(provas && !provas.public),
    detalhe: eb?.message ?? (provas ? (provas.public ? 'está PÚBLICO — corrigir' : 'ok') : 'não existe'),
  })
  const midia = buckets?.find((b) => b.id === 'midia')
  out.push({ nome: 'Bucket "midia" (público)', ok: Boolean(midia?.public), detalhe: midia ? 'ok' : 'não existe' })

  // anon NÃO pode ler nada direto
  const { createClient } = await import('@supabase/supabase-js')
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: vazou } = await anon.from('colaboradores').select('id').limit(1)
  out.push({ nome: 'RLS: anônimo não lê colaboradores', ok: !vazou || vazou.length === 0 })

  return out
}

export default async function Status() {
  const checagens = await checar()
  const agora = agoraSP()
  const tudoOk = checagens.every((c) => c.ok)
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Logo className="text-4xl" />
      <h1 className="mt-6 text-2xl font-extrabold">Diagnóstico</h1>
      <p className="mt-1 text-suave">
        Agora em São Paulo: {agora.data} {agora.hora}
      </p>
      <div className="cartao mt-6 divide-y divide-borda">
        {checagens.map((c) => (
          <div key={c.nome} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <div className="font-bold">{c.nome}</div>
              {c.detalhe && <div className="text-sm text-suave">{c.detalhe}</div>}
            </div>
            <span className={`text-xl font-extrabold ${c.ok ? 'text-marca' : 'text-suave'}`}>{c.ok ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 font-bold">{tudoOk ? 'Tudo certo para a Etapa 2.' : 'Ainda falta algo — veja os ✗ acima.'}</p>
    </main>
  )
}
