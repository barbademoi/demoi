/**
 * LINKS E PREÇOS DE COMPRA.
 *
 * O ACESSO ANUAL é a oferta pública atual: pagamento ÚNICO de R$ 97 por 1 ano
 * com tudo incluso. Sai da Hotmart pelo produto 7737399 — o mesmo que vendia o
 * acesso vitalício por R$ 47, com o preço trocado pelo dono. O link é o mesmo
 * de sempre, então material antigo que aponte pra ele continua funcionando e
 * passa a vender o ano.
 *
 * A ASSINATURA RECORRENTE saiu da página pública, mas os links continuam aqui:
 * quem já assina segue sendo cobrado e atendido normalmente, e apagar as
 * constantes só esconderia de nós o que ainda está no ar.
 */
export const CHECKOUT_ANUAL_UNICO_URL = 'https://pay.hotmart.com/D105833676F'
export const PRECO_ANUAL_UNICO = 97
export const DIAS_ANUAL_UNICO = 365

// ── Assinatura recorrente — fora da página pública, viva por trás ──────────
export const CHECKOUT_MENSAL_URL = 'https://pay.hotmart.com/L107067258I?off=vmgc66i0'
export const CHECKOUT_ANUAL_URL = 'https://pay.hotmart.com/L107067258I?off=01rp1xhx'

export const PRECO_MENSAL = 34.9
export const PRECO_ANUAL = 297
export const EQUIVALENTE_MENSAL_ANUAL = PRECO_ANUAL / 12
export const ECONOMIA_ANUAL = PRECO_MENSAL * 12 - PRECO_ANUAL
