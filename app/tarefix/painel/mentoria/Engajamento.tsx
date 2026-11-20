import type { Engajamento } from '@/lib/tarefix/mentoria'

const NOMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function quando(iso: string) {
  const d = new Date(iso)
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const ontem = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() - 86_400_000))
  const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(d)
  if (dia === hoje) return `hoje às ${hora}`
  if (dia === ontem) return `ontem às ${hora}`
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)} às ${hora}`
}

/** Nível de empenho pelo uso dos últimos 7 dias. */
function nivel(e: Engajamento): { texto: string; cor: string } {
  if (!e.ultimo) return { texto: 'Nunca abriu', cor: 'bg-tf-texto text-tf-fundo' }
  if (e.diasAtivos >= 5) return { texto: 'Empenhado', cor: 'bg-[#0E7A3B] text-white' }
  if (e.diasAtivos >= 2) return { texto: 'Morno', cor: 'bg-[#D4A017] text-[#1a1408]' }
  return { texto: 'Sumido', cor: 'bg-tf-texto text-tf-fundo' }
}

/** Selos curtos para o cartão da lista. */
export function SelosEngajamento({ e }: { e: Engajamento }) {
  const n = nivel(e)
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
      <span className={`rounded-full px-2 py-1 ${n.cor}`}>{n.texto}</span>
      {e.ultimo && <span className="rounded-full bg-tf-borda px-2 py-1">abriu {quando(e.ultimo)}</span>}
      <span className={`rounded-full px-2 py-1 ${e.instalado ? 'bg-tf-marca-clara text-tf-marca-texto' : 'bg-tf-borda text-tf-suave'}`}>{e.instalado ? '📱 instalado' : '📱 não instalou'}</span>
      <span className={`rounded-full px-2 py-1 ${e.notificacoes ? 'bg-tf-marca-clara text-tf-marca-texto' : 'bg-tf-borda text-tf-suave'}`}>{e.notificacoes ? '🔔 notificações' : '🔕 sem notificações'}</span>
    </div>
  )
}

/** Visor completo para a página do mentorado. */
export function VisorEngajamento({ e, primeiroNome }: { e: Engajamento; primeiroNome: string }) {
  const n = nivel(e)
  const max = Math.max(1, ...e.dias.map((d) => d.n))
  const total = e.dias.reduce((s, d) => s + d.n, 0)
  return (
    <section className="tf-cartao space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Engajamento</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${n.cor}`}>{n.texto}</span>
      </div>

      <ul className="grid grid-cols-2 gap-2 text-sm">
        <li className="rounded-2xl bg-tf-fundo p-3">
          <p className="text-tf-suave">Abriu o link</p>
          <p className="font-extrabold">{e.primeiro ? `sim, desde ${quando(e.primeiro).replace(/ às .*/, '')}` : 'ainda não'}</p>
        </li>
        <li className="rounded-2xl bg-tf-fundo p-3">
          <p className="text-tf-suave">Último acesso</p>
          <p className="font-extrabold">{e.ultimo ? quando(e.ultimo) : '—'}</p>
        </li>
        <li className="rounded-2xl bg-tf-fundo p-3">
          <p className="text-tf-suave">Tela de início</p>
          <p className="font-extrabold">{e.instalado ? '📱 instalou' : 'não instalou'}</p>
        </li>
        <li className="rounded-2xl bg-tf-fundo p-3">
          <p className="text-tf-suave">Notificações</p>
          <p className="font-extrabold">{e.notificacoes ? '🔔 ativas' : '🔕 desligadas'}</p>
        </li>
      </ul>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
          <p className="font-bold">Aberturas nos últimos 7 dias</p>
          <p className="text-tf-suave">
            hoje: <b className="text-tf-texto">{e.hoje}</b> · total: <b className="text-tf-texto">{total}</b> · {e.diasAtivos} de 7 dias
          </p>
        </div>
        <div className="flex h-28 items-end gap-2" role="img" aria-label={`Aberturas por dia: ${e.dias.map((d) => d.n).join(', ')}`}>
          {e.dias.map((d, i) => (
            <div key={d.data} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold tabular-nums text-tf-suave">{d.n || ''}</span>
              <div
                className={`w-full rounded-t-lg ${i === 6 ? 'bg-tf-marca' : 'bg-tf-marca/40'}`}
                style={{ height: `${d.n ? Math.max(8, (d.n / max) * 72) : 3}px` }}
              />
              <span className={`text-[11px] ${i === 6 ? 'font-extrabold' : 'text-tf-suave'}`}>{i === 6 ? 'hoje' : NOMES[new Date(`${d.data}T12:00:00Z`).getUTCDay()]}</span>
            </div>
          ))}
        </div>
      </div>

      {!e.ultimo && <p className="text-sm text-tf-suave">{primeiroNome} ainda não abriu o link. Reenvie pelo WhatsApp no cartão abaixo.</p>}
      {e.ultimo && !e.notificacoes && <p className="text-sm text-tf-suave">Sem notificações, {primeiroNome} não recebe os lembretes. Peça para tocar em “Ativar notificações” no link.</p>}
      <p className="text-xs text-tf-suave">Cada abertura conta quando ele abre o link ou volta para ele depois de 10 minutos. “Instalou” = já abriu pelo ícone da tela de início.</p>
    </section>
  )
}
