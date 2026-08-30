import Link from 'next/link'
import { mensagemAcesso, type Avaliacao } from '@/lib/assinatura/acesso'

/**
 * Aviso de acesso perto de vencer, vencido em carência, ou em revisão.
 *
 * Serve tanto pro assinante recorrente quanto pra quem comprou 1 ano avulso —
 * `mensagemAcesso` já troca o sujeito da frase pelo tipo. O que muda aqui é o
 * rótulo do botão: "Regularizar" é o verbo de quem tem cobrança pra acertar;
 * quem comprou um ano não tem nada a regularizar, tem que renovar.
 *
 * Vitalício NUNCA vê nada: `mensagemAcesso` devolve null pra ele, e o
 * componente some. Quem está em dia também não vê — aviso que aparece sempre
 * vira ruído e some da vista justamente quando importa.
 */
export default function AvisoAssinatura({ acesso }: { acesso: Avaliacao }) {
  const msg = mensagemAcesso(acesso)
  if (!msg) return null

  const urgente = acesso.estado === 'carencia'

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
      urgente
        ? 'border-red-400/40 bg-red-400/[0.08]'
        : 'border-amber-400/40 bg-amber-400/[0.08]'
    }`}>
      <p className={`font-sans text-xs leading-relaxed ${urgente ? 'text-red-200' : 'text-amber-200'}`}>
        {urgente ? '⚠️ ' : '⏳ '}{msg}
        {acesso.tipo !== 'anual' && acesso.cancelada && ' A assinatura está cancelada e não será renovada.'}
        {acesso.tipo !== 'anual' && acesso.atrasada && ' O último pagamento não foi identificado.'}
      </p>
      {acesso.estado !== 'revisar' && (
        <Link
          href="/assinatura"
          className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold text-text hover:bg-white/5"
        >
          {acesso.tipo === 'anual' ? 'Renovar' : 'Regularizar'}
        </Link>
      )}
    </div>
  )
}
