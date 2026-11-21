/**
 * AS CHAVES DO PUSH — lidas do banco, criadas na primeira vez.
 *
 * Antes isto eram três variáveis de ambiente na Vercel e um secret no GitHub.
 * Agora é uma linha em `push_config` (migration 063), no mesmo molde que o
 * Tarefix já usa neste projeto.
 *
 * ── POR QUE SAIU DO AMBIENTE ────────────────────────────────────────────────
 * A chave VAPID não precisa vir de fora: é um par que o servidor usa pra
 * assinar o que manda, e o único requisito é ser SEMPRE A MESMA — trocar a
 * pública invalida todas as inscrições feitas com a anterior, em silêncio.
 * Variável de ambiente é fácil de trocar sem querer e só vale depois de um
 * redeploy. O banco não tem nenhum dos dois problemas.
 *
 * ── A VARIÁVEL DE AMBIENTE AINDA GANHA ──────────────────────────────────────
 * Se `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` existirem, elas mandam. Isso
 * existe por um motivo só: se alguém JÁ tinha colado as chaves na Vercel e
 * algum aparelho já se inscreveu com aquela pública, passar a assinar com
 * outra deixaria esse aparelho mudo pra sempre. Quem nunca configurou nada
 * cai direto no banco, que é o caminho normal.
 */

// Import NOMEADO, e não default: `web-push` é CommonJS e não expõe default na
// interoperabilidade do Next.
import { generateVAPIDKeys } from 'web-push'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export interface ConfigPush {
  /** Chave pública — vai pro navegador, é pública por definição. */
  publica: string
  privada: string
  /** Segredo que o agendador manda no cabeçalho x-barbermeta-cron. */
  segredo: string
}

interface Linha {
  vapid_publico: string | null
  vapid_privado: string | null
  segredo_cron: string
}

/**
 * Só o segredo do agendador, sem tocar nas chaves.
 *
 * Existe pra que a rota do cron possa conferir QUEM está chamando antes de
 * fazer qualquer outra coisa. `configPush` cria o par VAPID quando ele ainda
 * não existe, e criar chave por causa de uma requisição não autenticada é
 * efeito colateral que não se justifica — ainda que inofensivo.
 */
export async function segredoCron(admin: Admin): Promise<string | null> {
  const { data, error } = await admin
    .from('push_config').select('segredo_cron').eq('id', 1).maybeSingle()
  if (error || !data) return null
  const s = (data as { segredo_cron: string }).segredo_cron
  return s && s.length >= 32 ? s : null
}

/**
 * Devolve as chaves e o segredo. `null` quando a 063 ainda não rodou — e aí
 * quem chama decide o que fazer, em vez de estourar no meio de um envio.
 */
export async function configPush(admin: Admin): Promise<ConfigPush | null> {
  const { data, error } = await admin
    .from('push_config')
    .select('vapid_publico, vapid_privado, segredo_cron')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[push] não deu pra ler push_config (a migration 063 rodou?):', error)
    return null
  }
  if (!data) {
    console.error('[push] push_config está vazia — rode a migration 063.')
    return null
  }

  const linha = data as Linha
  const envPublica = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const envPrivada = process.env.VAPID_PRIVATE_KEY

  // Caminho do legado: quem já tinha chave na Vercel continua com ela.
  if (envPublica && envPrivada) {
    return { publica: envPublica, privada: envPrivada, segredo: linha.segredo_cron }
  }

  if (linha.vapid_publico && linha.vapid_privado) {
    return { publica: linha.vapid_publico, privada: linha.vapid_privado, segredo: linha.segredo_cron }
  }

  // Primeira vez: cria o par e grava.
  const novas = generateVAPIDKeys()

  // O `is('vapid_publico', null)` é a trava: se duas requisições chegarem
  // juntas, a segunda não sobrescreve a chave que a primeira acabou de gravar.
  // Sem isso, um aparelho que se inscreveu no mesmo segundo ficaria preso a
  // uma chave que o servidor nunca mais usaria.
  const { error: erroUpdate } = await admin
    .from('push_config')
    .update({
      vapid_publico: novas.publicKey,
      vapid_privado: novas.privateKey,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', 1)
    .is('vapid_publico', null)

  if (erroUpdate) {
    console.error('[push] não deu pra gravar as chaves VAPID:', erroUpdate)
    return null
  }

  // Relê: quem ganhou a corrida pode ter sido a outra requisição.
  const { data: final, error: erroFinal } = await admin
    .from('push_config')
    .select('vapid_publico, vapid_privado, segredo_cron')
    .eq('id', 1)
    .maybeSingle()

  const f = final as Linha | null
  if (erroFinal || !f?.vapid_publico || !f?.vapid_privado) {
    console.error('[push] as chaves VAPID não ficaram gravadas:', erroFinal)
    return null
  }

  console.log('[push] chaves VAPID criadas e guardadas em push_config.')
  return { publica: f.vapid_publico, privada: f.vapid_privado, segredo: f.segredo_cron }
}
