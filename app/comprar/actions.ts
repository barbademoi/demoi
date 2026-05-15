'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { mpPreference } from '@/lib/mercadopago'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.barbermeta.com.br'
const VALOR   = 47.00

export async function iniciarCompra(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const nome     = (formData.get('nome')     as string ?? '').trim()
  const email    = (formData.get('email')    as string ?? '').toLowerCase().trim()
  const telefone = (formData.get('telefone') as string ?? '').trim() || null

  if (!nome || nome.length < 2)          return { error: 'Informe seu nome completo.' }
  if (!email || !email.includes('@'))    return { error: 'Informe um email válido.' }

  const admin = createAdminClient()

  // Cria registro pendente — o id vira o external_reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: compra, error: errCompra } = await (admin as any)
    .from('compras_pendentes')
    .insert({ email, nome, telefone, valor: VALOR })
    .select('id')
    .single()

  if (errCompra || !compra) {
    console.error('[comprar] erro ao criar compra_pendente:', errCompra)
    return { error: 'Erro interno. Tente novamente.' }
  }

  const externalRef: string = (compra as { id: string }).id

  // Cria Preference no Mercado Pago
  let initPoint: string
  try {
    const pref = await mpPreference.create({
      body: {
        items: [{
          id:         'barbermeta-vitalicio',
          title:      'BarberMeta — Acesso Vitalício',
          quantity:   1,
          unit_price: VALOR,
          currency_id: 'BRL',
        }],
        payer: { name: nome, email },
        back_urls: {
          success: `${APP_URL}/boas-vindas`,
          pending: `${APP_URL}/aguardando`,
          failure: `${APP_URL}/comprar?erro=1`,
        },
        auto_return:        'approved',
        external_reference: externalRef,
        notification_url:   `${APP_URL}/api/webhook/mercadopago`,
        statement_descriptor: 'BARBERMETA',
      },
    })

    if (!pref.init_point) throw new Error('init_point ausente')
    initPoint = pref.init_point

    // Salva preference_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('compras_pendentes')
      .update({ mp_preference_id: pref.id })
      .eq('id', externalRef)
  } catch (err) {
    console.error('[comprar] erro ao criar preference MP:', err)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('compras_pendentes').delete().eq('id', externalRef)
    return { error: 'Erro ao conectar com Mercado Pago. Tente novamente.' }
  }

  redirect(initPoint)
}
