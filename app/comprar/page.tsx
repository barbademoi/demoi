import { redirect } from 'next/navigation'
import { CHECKOUT_MENSAL_URL } from '@/lib/checkout'

/**
 * /comprar — VENDA ENCERRADA NESTE CAMINHO.
 *
 * Esta página seguia vendendo o acesso VITALÍCIO por R$ 47 via Mercado Pago,
 * mesmo depois de a landing inteira ter migrado para assinatura. E o webhook do
 * Mercado Pago cria a conta com `tipo_acesso: 'vitalicio'` — ou seja, ela não
 * estava só desatualizada: continuava FABRICANDO o produto descontinuado, e
 * cada compra nova entrava como permanente, fora da régua de assinatura.
 *
 * A rota não é apagada porque o endereço circula: pode estar num anúncio
 * antigo, numa conversa de WhatsApp ou num favorito. Dar 404 em quem queria
 * comprar é pior do que levar ao checkout certo.
 *
 * O webhook do Mercado Pago segue no ar de propósito, pra não derrubar
 * pagamento que já estivesse em trânsito quando isto subiu.
 */
export const dynamic = 'force-dynamic'

export default function ComprarPage() {
  redirect(CHECKOUT_MENSAL_URL)
}
