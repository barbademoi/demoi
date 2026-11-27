import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { dataBR, hojeSP } from '@/lib/format'
import { semanaDoMembro, type Membro } from '@/lib/membro'
import { rotulo, FATURAMENTO } from '@/lib/opcoes'

export default async function Diagnosticos() {
  const { supabase } = await requireAdmin()
  const [{ data: ms }, { data: ds }] = await Promise.all([
    supabase.from('members').select('*').in('status', ['ativo', 'cancelado']).order('nome'),
    supabase.from('diagnosticos').select('member_id, tipo, created_at, respostas'),
  ])
  const hoje = hojeSP()
  const membros = (ms as Membro[]) ?? []
  const por = (id: string, tipo: string) => (ds ?? []).find((d) => d.member_id === id && d.tipo === tipo)

  return (
    <div>
      <h1 className="text-2xl font-black">Diagnósticos</h1>
      <p className="mb-5 text-suave">Entrada e reavaliação de 90 dias (libera na semana 13 do membro). Toque no nome para ver tudo e comparar.</p>
      <div className="overflow-x-auto">
        <table className="card w-full min-w-[640px] text-left text-sm">
          <thead className="text-suave">
            <tr>
              <th className="p-3">Membro</th>
              <th className="p-3">Semana</th>
              <th className="p-3">Entrada</th>
              <th className="p-3">Faturamento (entrada → 90d)</th>
              <th className="p-3">90 dias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {membros.map((m) => {
              const e = por(m.id, 'entrada')
              const n = por(m.id, '90dias')
              const sem = semanaDoMembro(m.data_inicio, hoje)
              return (
                <tr key={m.id}>
                  <td className="p-3"><Link href={`/admin/membros/${m.id}`} className="font-semibold hover:text-latao">{m.nome}</Link></td>
                  <td className="p-3">{sem || '—'}</td>
                  <td className="p-3">{e ? dataBR(e.created_at) : <span className="text-alerta">pendente</span>}</td>
                  <td className="p-3">
                    {rotulo(FATURAMENTO, e?.respostas?.faturamento) || '—'}
                    {n && ` → ${rotulo(FATURAMENTO, n.respostas?.faturamento) || '—'}`}
                  </td>
                  <td className="p-3">{n ? dataBR(n.created_at) : sem >= 13 ? <span className="text-alerta">liberada, não respondeu</span> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
