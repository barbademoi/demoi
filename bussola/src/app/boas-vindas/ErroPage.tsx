import Link from 'next/link'
import { AlertCircle, Mail } from 'lucide-react'

type Motivo =
  | 'parametros_faltando'
  | 'compra_nao_encontrada'
  | 'compra_cancelada'
  | 'compra_pendente'

const MENSAGENS: Record<Motivo, { titulo: string; texto: string }> = {
  parametros_faltando: {
    titulo: 'Link incompleto',
    texto:
      'Esse link de boas-vindas não veio com todas as informações. Verifique se você copiou o link inteiro do email da Hotmart.',
  },
  compra_nao_encontrada: {
    titulo: 'Compra não encontrada',
    texto:
      'Não achamos sua compra no nosso sistema. Pode ser que ainda esteja sendo processada — espera 1-2 minutos e recarrega. Se persistir, fala com a gente.',
  },
  compra_cancelada: {
    titulo: 'Compra cancelada',
    texto:
      'Essa compra foi cancelada ou estornada. Se foi engano, faça uma nova compra ou fala com o suporte.',
  },
  compra_pendente: {
    titulo: 'Pagamento ainda não aprovado',
    texto:
      'Sua compra ainda está sendo processada pela Hotmart. Geralmente leva alguns minutos. Recarrega essa página em instantes.',
  },
}

export function ErroPage({ motivo, email }: { motivo: Motivo; email?: string }) {
  const { titulo, texto } = MENSAGENS[motivo]
  return (
    <main className="min-h-screen bg-areia flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto" />
        </div>

        <div className="card p-6 sm:p-8 space-y-5 text-center">
          <AlertCircle size={48} strokeWidth={1.5} className="text-marrom mx-auto" />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-preto leading-tight">{titulo}</h1>
            <p className="text-grafite text-sm leading-relaxed">{texto}</p>
            {email && (
              <p className="text-xs text-chumbo">
                Email do link: <span className="font-mono">{email}</span>
              </p>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <p className="text-text font-medium inline-flex items-center gap-1.5 justify-center">
              <Mail size={14} strokeWidth={1.5} /> Precisa de ajuda?
            </p>
            <p className="text-chumbo">
              Fala com Carlos no WhatsApp.
            </p>
            <Link
              href="/entrar"
              className="inline-block text-marrom underline text-sm mt-2"
            >
              Já tenho conta — entrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
