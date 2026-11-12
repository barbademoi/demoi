import { createClient } from '@supabase/supabase-js'
import { Logo } from '@/components/tarefix/Logo'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { agoraSP, horarioCurto } from '@/lib/tarefix/datas'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Diagnóstico' }

type Checagem = { nome: string; ok: boolean; detalhe?: string }

const TABELAS = [
  'empresas', 'donos', 'funcoes', 'colaboradores', 'tarefas_modelo', 'tarefas_avulsas', 'folgas',
  'tarefas_dia', 'extras', 'bonus_config', 'avisos', 'meses_fechados',
]

// Diagnóstico: conexão, tabelas, conta do dono, buckets e bloqueio de anônimo.
// Não mostra nenhum dado sensível — só ✓/✗ e contagens.
async function checar(): Promise<Checagem[]> {
  const out: Checagem[] = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [{ nome: 'Chaves do Supabase', ok: false, detalhe: 'não configuradas' }]
  }

  const db = createTarefixAdmin()
  for (const t of TABELAS) {
    const { count, error } = await db.from(t).select('*', { count: 'exact', head: true })
    out.push({ nome: `Tabela tarefix.${t}`, ok: !error, detalhe: error ? error.message : `${count ?? 0} linha(s)` })
  }

  const { data: empresa } = await db.from('empresas').select('nome, horario_fechamento').limit(1).maybeSingle()
  out.push({
    nome: 'Empresa',
    ok: Boolean(empresa),
    detalhe: empresa ? `${empresa.nome} · fecha às ${horarioCurto(empresa.horario_fechamento)}` : 'abra /tarefix/instalar',
  })
  const { count: donos } = await db.from('donos').select('*', { count: 'exact', head: true })
  out.push({ nome: 'Conta de dono', ok: (donos ?? 0) > 0, detalhe: `${donos ?? 0} dono(s)` })

  const { data: buckets, error: eb } = await db.storage.listBuckets()
  const provas = buckets?.find((b) => b.id === 'tarefix-provas')
  out.push({
    nome: 'Fotos das tarefas (tarefix-provas, privado)',
    ok: Boolean(provas && !provas.public),
    detalhe: eb?.message ?? (provas ? (provas.public ? 'está PÚBLICO — corrigir' : 'ok') : 'não existe'),
  })
  const midia = buckets?.find((b) => b.id === 'tarefix-midia')
  out.push({ nome: 'Logo e fotos de perfil (tarefix-midia)', ok: Boolean(midia?.public), detalhe: midia ? 'ok' : 'não existe' })

  // anônimo NÃO pode ler nada do Tarefix
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: 'tarefix' },
    auth: { persistSession: false },
  })
  const { data: vazou } = await anon.from('colaboradores').select('id').limit(1)
  out.push({ nome: 'Segurança: anônimo não lê colaboradores', ok: !vazou || vazou.length === 0 })

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
      <p className="mt-1 text-tf-suave">
        Agora em São Paulo: {agora.data} {agora.hora}
      </p>
      <div className="tf-cartao mt-6 divide-y divide-tf-borda">
        {checagens.map((c) => (
          <div key={c.nome} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <div className="font-bold">{c.nome}</div>
              {c.detalhe && <div className="text-sm text-tf-suave">{c.detalhe}</div>}
            </div>
            <span className={`text-xl font-extrabold ${c.ok ? 'text-tf-marca' : 'text-tf-suave'}`}>{c.ok ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 font-bold">{tudoOk ? 'Tudo certo para a Etapa 2.' : 'Ainda falta algo — veja os ✗ acima.'}</p>
    </main>
  )
}
