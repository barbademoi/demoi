import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkAdmin } from '@/lib/admin'
import { ComprasAdminClient, type Compra, type WebhookRaw } from './ComprasAdminClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin — Compras Hotmart',
  robots: { index: false, follow: false },
}

export default async function ComprasAdminPage() {
  const access = await checkAdmin()
  if (!access.ok) {
    if (access.status === 401) redirect('/entrar')
    redirect('/painel')
  }

  const admin = createAdminClient()

  const [comprasResp, falhosResp, totaisResp] = await Promise.all([
    admin
      .from('compras_hotmart')
      .select('id, transaction_id, email_comprador, nome_comprador, status, valor_pago, created_at, usuario_id, estabelecimento_id, senha_temporaria')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('webhooks_recebidos')
      .select('id, event, erro_processamento, tentativas, recebido_em, ultima_tentativa_em, payload')
      .eq('origem', 'hotmart')
      .eq('processado', false)
      .order('recebido_em', { ascending: false })
      .limit(20),
    admin
      .from('compras_hotmart')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
  ])

  const compras = (comprasResp.data ?? []) as unknown as Compra[]
  const webhooksFalhos = (falhosResp.data ?? []) as unknown as WebhookRaw[]
  const totalAprovadas = totaisResp.count ?? 0

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-marrom/10 text-marrom text-xs font-semibold uppercase tracking-wider">
          <Shield size={12} strokeWidth={2} />
          Admin
        </div>
        <h1 className="text-2xl font-serif text-preto">Compras Hotmart</h1>
        <p className="text-sm text-grafite">
          Monitoramento de webhooks e compras processadas. Acesso restrito.
        </p>
      </header>

      <ComprasAdminClient
        compras={compras}
        webhooksFalhos={webhooksFalhos}
        totalAprovadas={totalAprovadas}
      />
    </main>
  )
}
